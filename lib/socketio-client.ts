import { io, Socket } from 'socket.io-client';

class SocketIOClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private authenticatedUserId: string | null = null;
  private eventCallbacks = new Map<string, Set<Function>>();
  private pendingSubscriptions = new Set<string>();

  constructor() {
    console.log('🔌 Socket.IO Client: Created');
    // Auto-connect when created
    this.connect().catch(error => {
      console.error('🔌 Socket.IO Client: Failed to auto-connect:', error);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        console.log('🔌 Socket.IO Client: Already connected');
        resolve();
        return;
      }

      // Clean up existing socket if it exists
      if (this.socket) {
        console.log('🔌 Socket.IO Client: Cleaning up existing socket');
        this.socket.disconnect();
        this.socket = null;
      }

      console.log('🔌 Socket.IO Client: Connecting to Socket.IO server...');
      
      this.socket = io('http://192.168.1.122:3001', {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false, // Don't force new connections
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket.IO Client: Connected successfully');
        console.log('🔌 Socket.IO Client: Socket ID:', this.socket?.id);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket.IO Client: Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO Client: Disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('authenticated', (data) => {
        console.log('🔌 Socket.IO Client: Authenticated as:', data.userId);
        this.authenticatedUserId = data.userId;
        this.processPendingSubscriptions();
      });

      this.socket.on('message-received', (data) => {
        console.log('🔌 Socket.IO Client: Message received:', data);
        console.log('🔌 Socket.IO Client: Message data structure:', JSON.stringify(data, null, 2));
        console.log('🔌 Socket.IO Client: About to trigger new-message callbacks');
        this.triggerCallbacks('new-message', data);
      });

      this.socket.on('user-typing', (data) => {
        console.log('🔌 Socket.IO Client: User typing:', data);
        if (data.isTyping) {
          this.triggerCallbacks('user_typing', data);
        } else {
          this.triggerCallbacks('user_stopped_typing', data);
        }
      });

      this.socket.on('error', (error) => {
        console.error('🔌 Socket.IO Client: Error:', error);
        console.error('🔌 Socket.IO Client: Error details:', {
          message: error.message,
          type: error.type,
          description: error.description,
          context: error.context,
          stack: error.stack
        });
      });

      // Add support for other events that components might expect
      this.socket.on('message-status-updated', (data) => {
        console.log('🔌 Socket.IO Client: Message status updated:', data);
        this.triggerCallbacks('message-status-updated', data);
      });

      this.socket.on('reaction-updated', (data) => {
        console.log('🔌 Socket.IO Client: Reaction updated:', data);
        this.triggerCallbacks('reaction-updated', data);
      });

      this.socket.on('message-deleted', (data) => {
        console.log('🔌 Socket.IO Client: Message deleted:', data);
        this.triggerCallbacks('message-deleted', data);
      });

      this.socket.on('message-updated', (data) => {
        console.log('🔌 Socket.IO Client: Message updated:', data);
        this.triggerCallbacks('message-updated', data);
      });

      this.socket.on('presence_update', (data) => {
        console.log('🔌 Socket.IO Client: Presence update:', data);
        this.triggerCallbacks('presence_update', data);
      });
    });
  }

  authenticate(userId: string): void {
    if (!this.socket || !this.isConnected) {
      console.log('🔌 Socket.IO Client: Not connected, queuing authentication');
      this.pendingSubscriptions.add(`auth-${userId}`);
      return;
    }

    if (this.authenticatedUserId === userId) {
      console.log('🔌 Socket.IO Client: Already authenticated as', userId, ', skipping');
      this.processPendingSubscriptions();
      return;
    }

    console.log('🔌 Socket.IO Client: Authenticating user:', userId);
    this.socket.emit('authenticate', { userId });
  }

  subscribe(channel: string): { bind: (event: string, callback: Function) => void } {
    console.log('🔌 Socket.IO Client: Subscribing to channel:', channel);
    
    // Always return an object with bind method for compatibility
    const channelHandler = {
      bind: (event: string, callback: Function) => {
        console.log(`🔌 Socket.IO Client: Binding event ${event} for channel ${channel}`);
        this.bind(event, callback);
      }
    };
    
    if (!this.socket || !this.isConnected) {
      console.log('🔌 Socket.IO Client: Not connected, queuing subscription');
      this.pendingSubscriptions.add(channel);
      return channelHandler;
    }

    if (!this.authenticatedUserId) {
      console.log('🔌 Socket.IO Client: Not authenticated, queuing subscription');
      this.pendingSubscriptions.add(channel);
      return channelHandler;
    }

    // Handle different channel types
    if (channel.startsWith('conversation-')) {
      const conversationId = channel.replace('conversation-', '');
      this.socket.emit('join-conversation', { conversationId });
    } else if (channel.startsWith('user-')) {
      // User channels are handled automatically during authentication
      console.log('🔌 Socket.IO Client: User channel subscription handled by authentication');
    } else if (channel.startsWith('typing-')) {
      const conversationId = channel.replace('typing-', '');
      this.socket.emit('join-conversation', { conversationId }); // Join conversation to receive typing events
    } else if (channel.startsWith('presence-')) {
      const conversationId = channel.replace('presence-', '');
      this.socket.emit('join-conversation', { conversationId }); // Join conversation to receive presence events
    } else {
      console.log('🔌 Socket.IO Client: Unknown channel type:', channel);
    }

    return channelHandler;
  }

  unsubscribe(channel: string): void {
    console.log('🔌 Socket.IO Client: Unsubscribing from channel:', channel);
    
    if (!this.socket || !this.isConnected) {
      console.log('🔌 Socket.IO Client: Not connected, cannot unsubscribe');
      return;
    }

    // Handle different channel types
    if (channel.startsWith('conversation-')) {
      const conversationId = channel.replace('conversation-', '');
      this.socket.emit('leave-conversation', { conversationId });
    } else if (channel.startsWith('user-')) {
      // User channels are handled automatically during disconnect/reconnect
    } else if (channel.startsWith('typing-')) {
      const conversationId = channel.replace('typing-', '');
      this.socket.emit('leave-conversation', { conversationId });
    } else if (channel.startsWith('presence-')) {
      const conversationId = channel.replace('presence-', '');
      this.socket.emit('leave-conversation', { conversationId });
    }
    
    // Remove all callbacks for this channel
    this.eventCallbacks.delete(channel);
  }

  bind(event: string, callback: Function): void {
    console.log('🔌 Socket.IO Client: Binding event:', event);
    
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  unbind(event: string, callback?: Function): void {
    console.log('🔌 Socket.IO Client: Unbinding event:', event);
    
    if (!this.eventCallbacks.has(event)) {
      return;
    }

    if (callback) {
      this.eventCallbacks.get(event)!.delete(callback);
    } else {
      this.eventCallbacks.get(event)!.clear();
    }
  }

  sendMessage(conversationId: string, message: any): void {
    if (!this.socket || !this.isConnected) {
      console.log('🔌 Socket.IO Client: Not connected, cannot send message');
      return;
    }

    console.log('🔌 Socket.IO Client: Sending message to conversation:', conversationId);
    this.socket.emit('new-message', { conversationId, message });
  }

  sendTyping(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing', { conversationId });
  }

  sendStopTyping(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('stop-typing', { conversationId });
  }

  private processPendingSubscriptions(): void {
    console.log('🔌 Socket.IO Client: Processing pending subscriptions:', this.pendingSubscriptions.size);
    
    const subscriptionsToProcess = Array.from(this.pendingSubscriptions);
    this.pendingSubscriptions.clear();
    
    for (const subscription of subscriptionsToProcess) {
      if (subscription.startsWith('auth-')) {
        const userId = subscription.replace('auth-', '');
        this.authenticate(userId);
      } else {
        console.log('🔌 Socket.IO Client: Processing pending subscription:', subscription);
        this.subscribe(subscription);
      }
    }
  }

  private triggerCallbacks(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      console.log(`🔌 Socket.IO Client: Triggering ${callbacks.size} callbacks for event:`, event);
      console.log(`🔌 Socket.IO Client: Event data:`, JSON.stringify(data, null, 2));
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('🔌 Socket.IO Client: Error in callback:', error);
        }
      });
    } else {
      console.log(`🔌 Socket.IO Client: No callbacks registered for event:`, event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Socket.IO Client: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.authenticatedUserId = null;
      this.eventCallbacks.clear();
      this.pendingSubscriptions.clear();
    }
  }

  getConnectionStatus(): { connected: boolean; authenticated: boolean; userId: string | null } {
    return {
      connected: this.isConnected,
      authenticated: !!this.authenticatedUserId,
      userId: this.authenticatedUserId
    };
  }
}

// Create and export a singleton instance
const socketIOClient = new SocketIOClient();
export default socketIOClient;
