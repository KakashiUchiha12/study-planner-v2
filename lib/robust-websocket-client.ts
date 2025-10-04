// Robust WebSocket client for real-time messaging
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
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 Robust WebSocket: Connecting to ${this.connectionUrl}`);

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const connectTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('🔌 Robust WebSocket: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startKeepAlive();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Robust WebSocket: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 Robust WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          this.stopKeepAlive();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('🔌 Robust WebSocket: Connection error:', error);
          console.error('🔌 Robust WebSocket: Connection URL:', this.connectionUrl);
          console.error('🔌 Robust WebSocket: WebSocket state:', this.ws?.readyState);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
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
        console.log('🔌 Robust WebSocket: Received pong');
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
      (subscription as any)[message.type](message);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 5000);
      console.log(`🔌 Robust WebSocket: Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().then(() => {
          this.resubscribeAll();
        }).catch((error) => {
          console.error('🔌 Robust WebSocket: Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('🔌 Robust WebSocket: Max reconnection attempts reached. Will retry in 10 seconds.');
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect().then(() => {
          this.resubscribeAll();
        });
      }, 10000);
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Add a small delay to ensure server is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.connect();
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Robust WebSocket: Error sending message:', error);
        this.handleReconnect();
      }
    } else {
      console.warn('🔌 Robust WebSocket: Cannot send message, connection not open');
    }
  }

  async subscribe(channel: string) {
    console.log(`🔌 Robust WebSocket: Subscribing to ${channel}`);
    
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
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Robust WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  async authenticate(userId: string) {
    console.log(`🔌 Robust WebSocket: Authenticating user ${userId}`);
    this.userId = userId;
    await this.ensureConnection();
    this.sendMessage({ type: 'auth', userId });
  }

  private resubscribeAll() {
    console.log('🔌 Robust WebSocket: Re-subscribing to all channels');
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

  destroy() {
    this.stopKeepAlive();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Global singleton instance
let robustWsClient: RobustWebSocketClient | null = null;
if (typeof window !== 'undefined') {
  if (!(window as any).__robustWsClient) {
    (window as any).__robustWsClient = new RobustWebSocketClient();
  }
  robustWsClient = (window as any).__robustWsClient;
}

export { robustWsClient };
