// Simple, stable WebSocket client that prevents multiple connections
class SimpleStableWebSocket {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private subscriptions: Map<string, Map<string, Function>> = new Map();
  private pendingMessages: any[] = [];
  private connectionId: string | null = null;
  private userId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Simple Stable WebSocket: Created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) {
      console.log('🔌 Simple Stable WebSocket: Already connecting, waiting...');
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Simple Stable WebSocket: Already connected');
      return Promise.resolve();
    }

    this.isConnecting = true;
    console.log(`🔌 Simple Stable WebSocket: Connecting to ${this.connectionUrl} (attempt ${this.reconnectAttempts + 1})`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.connectionUrl);

        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.warn('🔌 Simple Stable WebSocket: Connection timed out');
            this.ws.close(1000, 'Connection timed out');
            this.isConnecting = false;
            reject(new Error('Connection timed out'));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log('🔌 Simple Stable WebSocket: Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
          this.startHeartbeat();
          this.processPendingMessages();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Simple Stable WebSocket: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Simple Stable WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
          this.stopHeartbeat();

          // Attempt to reconnect if not a clean close
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`🔌 Simple Stable WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
            setTimeout(() => this.connect().catch(console.error), delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('🔌 Simple Stable WebSocket: Connection error:', error);
          this.isConnecting = false;
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
          this.stopHeartbeat();
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
        console.error('🔌 Simple Stable WebSocket: Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: any) {
    console.log('🔌 Simple Stable WebSocket: Received message:', message);

    switch (message.type) {
      case 'connected':
        this.connectionId = message.connectionId;
        console.log('🔌 Simple Stable WebSocket: Connection ID:', this.connectionId);
        break;
      case 'auth_success':
        this.userId = message.userId;
        console.log('🔌 Simple Stable WebSocket: Authenticated as:', this.userId);
        break;
      case 'pong':
        // Server responded to our ping
        break;
      default:
        if (message.channel) {
          this.handleChannelMessage(message);
        }
    }
  }

  private handleChannelMessage(message: any) {
    const callbacks = this.subscriptions.get(message.channel);
    if (callbacks) {
      const callback = callbacks.get(message.type);
      if (callback) {
        console.log(`🔌 Simple Stable WebSocket: Triggering ${message.type} on ${message.channel}`);
        callback(message);
      }
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Simple Stable WebSocket: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Simple Stable WebSocket: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Simple Stable WebSocket: Cannot send message, connection not open. Queuing message.', message);
      this.pendingMessages.push(message);
      this.connect().catch(console.error);
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

  subscribe(channel: string) {
    console.log(`🔌 Simple Stable WebSocket: Subscribing to ${channel}`);

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
    }

    // Ensure connection is initiated
    this.connect().catch(error => {
      console.error('🔌 Simple Stable WebSocket: Failed to connect for subscription:', error);
    });

    // Send subscribe message
    this.sendMessage({ type: 'subscribe', channel });

    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Simple Stable WebSocket: Binding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.set(event, callback);
      },
      unbind: (event: string) => {
        console.log(`🔌 Simple Stable WebSocket: Unbinding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.delete(event);
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Simple Stable WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'unsubscribe', channel });
    }
  }

  authenticate(userId: string) {
    console.log(`🔌 Simple Stable WebSocket: Authenticating user ${userId}`);
    this.userId = userId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'auth', userId });
    } else {
      this.pendingMessages.push({ type: 'auth', userId });
      this.connect().catch(console.error);
    }
  }

  sendTyping(conversationId: string, userName: string, userImage?: string) {
    this.sendMessage({ type: 'typing', conversationId, userName, userImage });
  }

  sendTypingStop(conversationId: string) {
    this.sendMessage({ type: 'typing_stop', conversationId });
  }

  sendPresence(conversationId: string, isOnline: boolean) {
    this.sendMessage({ type: 'presence', conversationId, isOnline });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  destroy() {
    console.log('🔌 Simple Stable WebSocket: Destroying client');
    this.stopHeartbeat();
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close(1000, 'Client disconnecting');
    }
    this.subscriptions.clear();
    this.pendingMessages = [];
    this.connectionId = null;
    this.userId = null;
    this.isConnecting = false;
  }
}

// Global singleton instance
let wsClientInstance: SimpleStableWebSocket | null = null;

export function getSimpleStableWebSocket(): SimpleStableWebSocket {
  if (typeof window !== 'undefined') {
    if (!(window as any).__simpleStableWsClient) {
      (window as any).__simpleStableWsClient = new SimpleStableWebSocket();
    }
    return (window as any).__simpleStableWsClient;
  }
  
  if (!wsClientInstance) {
    wsClientInstance = new SimpleStableWebSocket();
  }
  return wsClientInstance;
}

// Export the client instance
export const wsClient = getSimpleStableWebSocket();
