// Pure WebSocket client for real-time messaging - no Pusher dependencies

class WebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private subscriptions: Map<string, Map<string, Function>> = new Map(); // channel -> event -> callback
  private pendingMessages: any[] = [];
  private connectionId: string | null = null;
  private userId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Use separate WebSocket server on port 3001 to avoid Next.js conflicts
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      this.connectionUrl = `${protocol}//${host}:3001/api/ws`;
      console.log('🔌 WebSocket Client: Created with URL:', this.connectionUrl);
      
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.connect();
        }
      });
    } else {
      this.connectionUrl = 'ws://localhost:3001/api/ws';
    }
  }

  private connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 WebSocket Client: Connecting to ${this.connectionUrl} (attempt ${this.reconnectAttempts + 1})`);

      // Clear any existing timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }

      try {
        this.ws = new WebSocket(this.connectionUrl);

        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 WebSocket Client: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = (event) => {
          console.log('🔌 WebSocket Client: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          // Start heartbeat
          this.startHeartbeat();
          
          // Re-authenticate if we have a userId
          if (this.userId) {
            this.authenticate(this.userId);
          }
          
          // Resubscribe to channels
          this.resubscribeChannels();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 WebSocket Client: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket Client: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          this.isConnecting = false;
          this.connectionPromise = null;
          this.stopHeartbeat();
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
          }

          // Auto-reconnect unless it was a clean close or we've exceeded max attempts
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`🔌 WebSocket Client: Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('🔌 WebSocket Client: Max reconnection attempts reached. Giving up.');
          }
        };

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket Client: Connection error:', error);
          this.isConnecting = false;
          this.connectionPromise = null;
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        console.error('🔌 WebSocket Client: Error creating WebSocket:', error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
        
        // Set timeout for pong response
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
        }
        
        this.pongTimeout = setTimeout(() => {
          console.warn('🔌 WebSocket Client: Pong timeout - connection may be dead');
          if (this.ws) {
            this.ws.close();
          }
        }, 10000); // 10 second timeout for pong
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private resubscribeChannels() {
    for (const [channel] of this.subscriptions) {
      this.sendMessage({ type: 'subscribe', channel });
    }
  }

  private handleMessage(message: any) {
    console.log('🔌 WebSocket Client: Received message:', message);
    
    switch (message.type) {
      case 'connected':
        console.log('🔌 WebSocket Client: Connection confirmed, connectionId:', message.connectionId);
        this.connectionId = message.connectionId;
        this.processPendingMessages();
        break;
        
      case 'auth_success':
        console.log('🔌 WebSocket Client: Authentication successful for user:', message.userId);
        break;
        
      case 'pong':
        // Handle heartbeat response - clear pong timeout
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        console.log('🔌 WebSocket Client: Received pong from server');
        break;
        
      case 'ping':
        // Handle server ping - send pong response
        this.sendMessage({ type: 'pong', timestamp: Date.now() });
        console.log('🔌 WebSocket Client: Received ping from server, sent pong');
        break;
        
      default:
        // Handle channel-specific messages
        if (message.channel) {
          const callbacks = this.subscriptions.get(message.channel);
          if (callbacks) {
            const callback = callbacks.get(message.type);
            if (callback) {
              console.log(`🔌 WebSocket Client: Triggering ${message.type} on ${message.channel}`);
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
        console.log('🔌 WebSocket Client: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 WebSocket Client: Error sending message:', error);
      }
    } else {
      console.warn('🔌 WebSocket Client: Cannot send message, connection not open. Queuing message.');
      // Queue the message for later
      this.pendingMessages.push(message);
      
      // Try to connect if not connected
      if (!this.isConnecting) {
        this.connect().catch(console.error);
      }
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

  // Public API
  subscribe(channel: string) {
    console.log(`🔌 WebSocket Client: Subscribing to ${channel}`);
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
    }
    
    // Ensure connection
    this.connect().catch(console.error);
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 WebSocket Client: Binding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.set(event, callback);
        this.sendMessage({ type: 'subscribe', channel });
      },
      unbind: (event: string) => {
        console.log(`🔌 WebSocket Client: Unbinding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.delete(event);
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 WebSocket Client: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  authenticate(userId: string) {
    console.log(`🔌 WebSocket Client: Authenticating user ${userId}`);
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
    console.log('🔌 WebSocket Client: Destroying client');
    this.stopHeartbeat();
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
    }
    
    this.subscriptions.clear();
    this.pendingMessages = [];
    this.connectionId = null;
    this.userId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }
}

// Global singleton
let wsClientInstance: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__wsClient) {
      (window as any).__wsClient = new WebSocketClient();
    }
    return (window as any).__wsClient;
  }
  
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}

// Export the client instance
export const wsClient = getWebSocketClient();
