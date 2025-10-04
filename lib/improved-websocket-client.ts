// Improved WebSocket client with better error handling
class RobustWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionId: string | null = null;
  private userId: string | null = null;
  private subscriptions: Map<string, any> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private connectionUrl: string;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Robust WebSocket: Client created with URL:', this.connectionUrl);
    } else {
      // Fallback for server-side rendering
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Robust WebSocket: Client created (server-side)');
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
      console.log(`🔌 Robust WebSocket: Connecting to ${this.connectionUrl} (attempt ${this.reconnectAttempts + 1})`);

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
            console.error('🔌 Robust WebSocket: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Connection timeout'));
          }
        }, 15000); // Increased timeout to 15 seconds

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('🔌 Robust WebSocket: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.startKeepAlive();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Robust WebSocket: Error parsing message:', error, event.data);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 Robust WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            url: this.connectionUrl
          });
          
          this.isConnecting = false;
          this.connectionPromise = null;
          this.stopKeepAlive();
          
          // Handle specific close codes
          switch (event.code) {
            case 1006: // Abnormal closure
              console.error('🔌 Robust WebSocket: Abnormal closure detected - likely network or server issue');
              break;
            case 1003: // Unsupported data
              console.error('🔌 Robust WebSocket: Server rejected connection - check CORS/origin settings');
              break;
            case 1011: // Internal error
              console.error('🔌 Robust WebSocket: Server internal error');
              break;
          }
          
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('🔌 Robust WebSocket: Connection error:', error);
          console.error('🔌 Robust WebSocket: Error details:', {
            url: this.connectionUrl,
            readyState: this.ws?.readyState,
            reconnectAttempts: this.reconnectAttempts
          });
          
          this.isConnecting = false;
          this.connectionPromise = null;
          
          // Don't reject immediately on error, let onclose handle reconnection
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };

      } catch (error) {
        console.error('🔌 Robust WebSocket: Failed to create WebSocket:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private handleMessage(message: any) {
    console.log('🔌 Robust WebSocket: Received message:', message);

    switch (message.type) {
      case 'connected':
        this.connectionId = message.connectionId;
        console.log('🔌 Robust WebSocket: Connection ID:', this.connectionId);
        break;
      case 'auth_success':
        this.userId = message.userId;
        console.log('🔌 Robust WebSocket: Authenticated as:', this.userId);
        break;
      case 'pong':
        console.log('🔌 Robust WebSocket: Received pong - connection alive');
        break;
      case 'error':
        console.error('🔌 Robust WebSocket: Server error:', message.error);
        break;
      default:
        if (message.channel) {
          this.handleChannelMessage(message);
        }
    }
  }

  private handleChannelMessage(message: any) {
    const subscription = this.subscriptions.get(message.channel);
    if (subscription && (subscription as any)[message.type]) {
      console.log(`🔌 Robust WebSocket: Triggering ${message.type} on ${message.channel}`);
      try {
        (subscription as any)[message.type](message);
      } catch (error) {
        console.error('🔌 Robust WebSocket: Error in subscription callback:', error);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`🔌 Robust WebSocket: Reconnecting in ${Math.round(delay)}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
          await this.resubscribeAll();
        } catch (error) {
          console.error('🔌 Robust WebSocket: Reconnection failed:', error);
        }
      }, delay);
    } else {
      console.error('🔌 Robust WebSocket: Max reconnection attempts reached. Will retry in 30 seconds.');
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect().then(() => {
          this.resubscribeAll();
        }).catch(error => {
          console.error('🔌 Robust WebSocket: Long delay reconnection failed:', error);
        });
      }, 30000);
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('🔌 Robust WebSocket: Sending ping');
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000); // Ping every 25 seconds (before typical 30s timeout)
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('🔌 Robust WebSocket: Ensuring connection...');
      await this.connect();
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Robust WebSocket: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Robust WebSocket: Error sending message:', error);
        this.handleReconnect();
      }
    } else {
      console.warn('🔌 Robust WebSocket: Cannot send message, connection not open. State:', this.ws?.readyState);
    }
  }

  async subscribe(channel: string) {
    console.log(`🔌 Robust WebSocket: Subscribing to ${channel}`);
    
    try {
      await this.ensureConnection();
      
      const subscription = {};
      this.subscriptions.set(channel, subscription);
      this.sendMessage({ type: 'subscribe', channel });
      
      return {
        bind: (event: string, callback: (data: any) => void) => {
          console.log(`🔌 Robust WebSocket: Binding ${event} on ${channel}`);
          (subscription as any)[event] = callback;
        },
        unbind: (event: string, callback?: (data: any) => void) => {
          console.log(`🔌 Robust WebSocket: Unbinding ${event} on ${channel}`);
          delete (subscription as any)[event];
        }
      };
    } catch (error) {
      console.error('🔌 Robust WebSocket: Failed to subscribe to channel:', channel, error);
      throw error;
    }
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Robust WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'unsubscribe', channel });
    }
  }

  async authenticate(userId: string) {
    console.log(`🔌 Robust WebSocket: Authenticating user ${userId}`);
    this.userId = userId;
    try {
      await this.ensureConnection();
      this.sendMessage({ type: 'auth', userId });
    } catch (error) {
      console.error('🔌 Robust WebSocket: Authentication failed:', error);
      throw error;
    }
  }

  private async resubscribeAll() {
    console.log('🔌 Robust WebSocket: Re-subscribing to all channels');
    
    // Wait a moment for the connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const channel of this.subscriptions.keys()) {
      this.sendMessage({ type: 'subscribe', channel });
    }
  }

  // Additional methods for compatibility with existing pusher interface
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

  // Get connection status for debugging
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      connectionId: this.connectionId,
      userId: this.userId,
      subscriptions: Array.from(this.subscriptions.keys()),
      url: this.connectionUrl
    };
  }

  destroy() {
    console.log('🔌 Robust WebSocket: Destroying client');
    this.stopKeepAlive();
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
    this.connectionPromise = null;
  }
}

// Global singleton instance with better initialization
let robustWsClient: RobustWebSocketClient | null = null;

export function getWebSocketClient(): RobustWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__robustWsClient) {
      (window as any).__robustWsClient = new RobustWebSocketClient();
    }
    return (window as any).__robustWsClient;
  }
  
  // Server-side fallback
  if (!robustWsClient) {
    robustWsClient = new RobustWebSocketClient();
  }
  return robustWsClient;
}

export { robustWsClient };
