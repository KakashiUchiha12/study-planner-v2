// Working WebSocket client - just connects and stays connected
class WorkingWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private subscriptions: Map<string, Map<string, Function>> = new Map(); // channel -> event -> callback
  private pendingMessages: any[] = [];
  private connectionId: string | null = null;
  private userId: string | null = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Working WebSocket Client: Created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Working WebSocket Client: Created (server-side)');
    }
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        console.log('🔌 Working WebSocket Client: Already connecting, skipping');
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('🔌 Working WebSocket Client: Already connected');
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 Working WebSocket Client: Connecting to ${this.connectionUrl}`);

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Working WebSocket Client: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 5000); // 5 second timeout

        this.ws.onopen = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Working WebSocket Client: Connected successfully', event);
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Working WebSocket Client: Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Working WebSocket Client: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Working WebSocket Client: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          
          // Don't auto-reconnect - let components handle it
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🔌 Working WebSocket Client: Connection error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('🔌 Working WebSocket Client: Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    console.log('🔌 Working WebSocket Client: Handling message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'connected':
        console.log('🔌 Working WebSocket Client: Connection confirmed, connectionId:', message.connectionId);
        this.connectionId = message.connectionId;
        // Process any pending messages now that we're connected
        this.processPendingMessages();
        break;
        
      case 'auth_success':
        console.log('🔌 Working WebSocket Client: Authentication successful for user:', message.userId);
        this.userId = message.userId;
        break;
        
      case 'new-message':
        if (message.channel) {
          const handler = this.messageHandlers.get(message.channel);
          if (handler) {
            console.log(`🔌 Working WebSocket Client: Triggering handler for ${message.channel}`);
            handler(message);
          } else {
            console.log(`🔌 Working WebSocket Client: No handler found for ${message.channel}`);
          }
        }
        break;
        
      default:
        // Handle channel-specific messages
        if (message.channel) {
          const callbacks = this.subscriptions.get(message.channel);
          if (callbacks) {
            const callback = callbacks.get(message.type);
            if (callback) {
              console.log(`🔌 Working WebSocket Client: Triggering ${message.type} on ${message.channel}`);
              callback(message);
            }
          }
        }
        break;
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Working WebSocket Client: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Working WebSocket Client: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Working WebSocket Client: Cannot send message, connection not open. State:', this.ws?.readyState);
      // Queue the message for later
      this.pendingMessages.push(message);
    }
  }

  private processPendingMessages() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      while (this.pendingMessages.length > 0) {
        const message = this.pendingMessages.shift();
        this.sendMessage(message);
      }
    }
  }

  // Simple subscribe method that returns a channel object (not a promise)
  subscribe(channel: string) {
    console.log(`🔌 Working WebSocket Client: Subscribing to ${channel}`);
    
    // Initialize subscription tracking
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
    }
    
    // Connect in background if not connected
    this.connect().catch(error => {
      console.error('🔌 Working WebSocket Client: Failed to connect for subscription:', error);
    });
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Working WebSocket Client: Binding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.set(event, callback);
        
        // Send subscribe message when connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'subscribe', channel });
        } else {
          // Queue the subscription for when we connect
          this.pendingMessages.push({ type: 'subscribe', channel });
        }
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Working WebSocket Client: Unbinding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.delete(event);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'unsubscribe', channel });
        }
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Working WebSocket Client: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'unsubscribe', channel });
    }
  }

  authenticate(userId: string) {
    console.log(`🔌 Working WebSocket Client: Authenticating user ${userId}`);
    this.userId = userId;
    this.sendMessage({ type: 'auth', userId });
  }

  sendTyping(conversationId: string, userName: string, userImage?: string) {
    this.sendMessage({
      type: 'typing',
      conversationId,
      userName,
      userImage
    });
  }

  sendTypingStop(conversationId: string) {
    this.sendMessage({
      type: 'typing_stop',
      conversationId
    });
  }

  sendPresence(conversationId: string, isOnline: boolean) {
    this.sendMessage({
      type: 'presence',
      conversationId,
      isOnline
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  destroy() {
    console.log('🔌 Working WebSocket Client: Destroying client');
    if (this.ws) {
      this.ws.close();
    }
    this.messageHandlers.clear();
    this.subscriptions.clear();
    this.pendingMessages = [];
    this.connectionId = null;
    this.userId = null;
    this.isConnecting = false;
  }
}

// Global singleton instance
let workingWsClient: WorkingWebSocketClient | null = null;

export function getWorkingWebSocketClient(): WorkingWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__workingWsClient) {
      (window as any).__workingWsClient = new WorkingWebSocketClient();
    }
    return (window as any).__workingWsClient;
  }
  
  if (!workingWsClient) {
    workingWsClient = new WorkingWebSocketClient();
  }
  return workingWsClient;
}

export { workingWsClient };
