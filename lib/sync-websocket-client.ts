// Synchronous WebSocket client wrapper for real-time messaging
// This provides a synchronous API that components expect while handling async operations internally

class SyncWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private subscriptions: Map<string, any> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private userId: string | null = null;
  private connectionPromise: Promise<void> | null = null;
  private pendingSubscriptions: Map<string, any> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Sync WebSocket: Client created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Sync WebSocket: Client created (server-side)');
    }
  }

  private connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 Sync WebSocket: Connecting to ${this.connectionUrl} (attempt ${this.reconnectAttempts + 1})`);

      // Clean up any existing connection
      if (this.ws) {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      }

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const connectTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Sync WebSocket: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('🔌 Sync WebSocket: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Sync WebSocket: Error parsing message:', error, event.data);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 Sync WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          this.isConnecting = false;
          this.connectionPromise = null;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('🔌 Sync WebSocket: Connection error:', error);
          this.isConnecting = false;
          this.connectionPromise = null;
          
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };

      } catch (error) {
        console.error('🔌 Sync WebSocket: Failed to create WebSocket:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private handleMessage(message: any) {
    console.log('🔌 Sync WebSocket: Received message:', message);

    switch (message.type) {
      case 'connected':
        console.log('🔌 Sync WebSocket: Connection ID:', message.connectionId);
        // Process pending subscriptions
        this.processPendingSubscriptions();
        break;
      case 'auth_success':
        this.userId = message.userId;
        console.log('🔌 Sync WebSocket: Authenticated as:', this.userId);
        break;
      default:
        if (message.channel) {
          this.handleChannelMessage(message);
        }
    }
  }

  private handleChannelMessage(message: any) {
    const subscription = this.subscriptions.get(message.channel);
    if (subscription && subscription[message.type]) {
      console.log(`🔌 Sync WebSocket: Triggering ${message.type} on ${message.channel}`);
      try {
        subscription[message.type](message);
      } catch (error) {
        console.error('🔌 Sync WebSocket: Error in subscription callback:', error);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 5000);
      
      console.log(`🔌 Sync WebSocket: Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
          this.processPendingSubscriptions();
        } catch (error) {
          console.error('🔌 Sync WebSocket: Reconnection failed:', error);
        }
      }, delay);
    } else {
      console.error('🔌 Sync WebSocket: Max reconnection attempts reached. Will retry in 30 seconds.');
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect().then(() => {
          this.processPendingSubscriptions();
        }).catch(error => {
          console.error('🔌 Sync WebSocket: Long delay reconnection failed:', error);
        });
      }, 30000);
    }
  }

  private processPendingSubscriptions() {
    console.log('🔌 Sync WebSocket: Processing pending subscriptions');
    for (const [channel, subscription] of this.pendingSubscriptions) {
      this.subscriptions.set(channel, subscription);
      this.sendMessage({ type: 'subscribe', channel });
    }
    this.pendingSubscriptions.clear();
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Sync WebSocket: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Sync WebSocket: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Sync WebSocket: Cannot send message, connection not open. State:', this.ws?.readyState);
    }
  }

  // Synchronous subscribe method that components expect
  subscribe(channel: string) {
    console.log(`🔌 Sync WebSocket: Subscribing to ${channel}`);
    
    const subscription = {};
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Connection is open, subscribe immediately
      this.subscriptions.set(channel, subscription);
      this.sendMessage({ type: 'subscribe', channel });
    } else {
      // Connection not ready, queue the subscription
      this.pendingSubscriptions.set(channel, subscription);
      // Start connection in background
      this.connect().catch(error => {
        console.error('🔌 Sync WebSocket: Background connection failed:', error);
      });
    }
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Sync WebSocket: Binding ${event} on ${channel}`);
        subscription[event] = callback;
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Sync WebSocket: Unbinding ${event} on ${channel}`);
        delete subscription[event];
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Sync WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    this.pendingSubscriptions.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'unsubscribe', channel });
    }
  }

  authenticate(userId: string) {
    console.log(`🔌 Sync WebSocket: Authenticating user ${userId}`);
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
    console.log('🔌 Sync WebSocket: Destroying client');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
    }
    this.subscriptions.clear();
    this.pendingSubscriptions.clear();
    this.connectionPromise = null;
  }
}

// Global singleton instance
let syncWsClient: SyncWebSocketClient | null = null;

export function getSyncWebSocketClient(): SyncWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__syncWsClient) {
      (window as any).__syncWsClient = new SyncWebSocketClient();
    }
    return (window as any).__syncWsClient;
  }
  
  if (!syncWsClient) {
    syncWsClient = new SyncWebSocketClient();
  }
  return syncWsClient;
}

export { syncWsClient };
