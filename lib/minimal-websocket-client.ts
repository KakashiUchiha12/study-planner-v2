// Minimal WebSocket client - back to basics
class MinimalWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private subscriptions: Map<string, any> = new Map();
  private userId: string | null = null;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Minimal WebSocket: Client created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Minimal WebSocket: Client created (server-side)');
    }
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 Minimal WebSocket: Connecting to ${this.connectionUrl}`);

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Minimal WebSocket: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('🔌 Minimal WebSocket: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Minimal WebSocket: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Minimal WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🔌 Minimal WebSocket: Connection error:', error);
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
    console.log('🔌 Minimal WebSocket: Received message:', message);

    switch (message.type) {
      case 'connected':
        console.log('🔌 Minimal WebSocket: Connection ID:', message.connectionId);
        break;
      case 'auth_success':
        this.userId = message.userId;
        console.log('🔌 Minimal WebSocket: Authenticated as:', this.userId);
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
      console.log(`🔌 Minimal WebSocket: Triggering ${message.type} on ${message.channel}`);
      try {
        subscription[message.type](message);
      } catch (error) {
        console.error('🔌 Minimal WebSocket: Error in subscription callback:', error);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts; // 2s, 4s, 6s
      
      console.log(`🔌 Minimal WebSocket: Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch(error => {
          console.error('🔌 Minimal WebSocket: Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('🔌 Minimal WebSocket: Max reconnection attempts reached');
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Minimal WebSocket: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Minimal WebSocket: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Minimal WebSocket: Cannot send message, connection not open');
    }
  }

  // Synchronous subscribe method
  subscribe(channel: string) {
    console.log(`🔌 Minimal WebSocket: Subscribing to ${channel}`);
    
    const subscription = {};
    this.subscriptions.set(channel, subscription);
    
    // Connect and subscribe in background
    this.connect().then(() => {
      this.sendMessage({ type: 'subscribe', channel });
    }).catch(error => {
      console.error('🔌 Minimal WebSocket: Failed to connect for subscription:', error);
    });
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Minimal WebSocket: Binding ${event} on ${channel}`);
        subscription[event] = callback;
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Minimal WebSocket: Unbinding ${event} on ${channel}`);
        delete subscription[event];
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Minimal WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  authenticate(userId: string) {
    console.log(`🔌 Minimal WebSocket: Authenticating user ${userId}`);
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
    console.log('🔌 Minimal WebSocket: Destroying client');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.subscriptions.clear();
  }
}

// Global singleton instance
let minimalWsClient: MinimalWebSocketClient | null = null;

export function getMinimalWebSocketClient(): MinimalWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__minimalWsClient) {
      (window as any).__minimalWsClient = new MinimalWebSocketClient();
    }
    return (window as any).__minimalWsClient;
  }
  
  if (!minimalWsClient) {
    minimalWsClient = new MinimalWebSocketClient();
  }
  return minimalWsClient;
}

export { minimalWsClient };
