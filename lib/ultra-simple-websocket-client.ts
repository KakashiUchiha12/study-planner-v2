// Ultra simple WebSocket client - no complex logic, just basic connection
class UltraSimpleWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private subscriptions: Map<string, Map<string, Function>> = new Map();
  private isConnecting = false;
  private authenticatedUserId: string | null = null;
  private pendingSubscriptions: string[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Use separate WebSocket server on port 3001 to avoid Next.js conflicts
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      this.connectionUrl = `${protocol}//${host}:3001/api/ws`;
      console.log('🔌 Ultra Simple WebSocket: Created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3001/api/ws';
    }
  }

  private connect(): Promise<void> {
    if (this.isConnecting) {
      console.log('🔌 Ultra Simple WebSocket: Already connecting, waiting...');
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
      console.log('🔌 Ultra Simple WebSocket: Already connected');
      return Promise.resolve();
    }

    this.isConnecting = true;
    console.log(`🔌 Ultra Simple WebSocket: Connecting to ${this.connectionUrl}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.connectionUrl);

        this.ws.onopen = () => {
          console.log('🔌 Ultra Simple WebSocket: Connected successfully');
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Ultra Simple WebSocket: Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Ultra Simple WebSocket: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Ultra Simple WebSocket: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          
          // Don't try to reconnect automatically - let the user handle it
          if (event.code === 1006) {
            console.error('🔌 Ultra Simple WebSocket: 1006 error - connection closed abnormally');
          }
        };

        this.ws.onerror = (error) => {
          console.error('🔌 Ultra Simple WebSocket: Connection error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('🔌 Ultra Simple WebSocket: Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    console.log('🔌 Ultra Simple WebSocket: Handling message:', message);
    console.log('🔌 Ultra Simple WebSocket: Message type:', message.type);
    console.log('🔌 Ultra Simple WebSocket: Message channel:', message.channel);

    switch (message.type) {
      case 'connected':
        console.log('🔌 Ultra Simple WebSocket: Connection ID:', message.connectionId);
        break;
      case 'auth_success':
        console.log('🔌 Ultra Simple WebSocket: Authenticated as:', message.userId);
        this.authenticatedUserId = message.userId;
        // Process any pending subscriptions
        this.processPendingSubscriptions();
        break;
      case 'pong':
        console.log('🔌 Ultra Simple WebSocket: Received pong');
        break;
      default:
        if (message.channel) {
          console.log('🔌 Ultra Simple WebSocket: Handling channel message for:', message.channel);
          this.handleChannelMessage(message);
        } else {
          console.log('🔌 Ultra Simple WebSocket: Unknown message type without channel:', message.type);
        }
    }
  }

  private handleChannelMessage(message: any) {
    console.log(`🔌 Ultra Simple WebSocket: Handling channel message:`, message);
    console.log(`🔌 Ultra Simple WebSocket: Message type: ${message.type}, Channel: ${message.channel}`);
    console.log(`🔌 Ultra Simple WebSocket: Full channel message:`, JSON.stringify(message, null, 2));
    
    const callbacks = this.subscriptions.get(message.channel);
    if (callbacks) {
      console.log(`🔌 Ultra Simple WebSocket: Found callbacks for channel ${message.channel}`);
      const callback = callbacks.get(message.type);
      if (callback) {
        console.log(`🔌 Ultra Simple WebSocket: ✅ Triggering ${message.type} on ${message.channel}`);
        try {
          callback(message);
          console.log(`🔌 Ultra Simple WebSocket: ✅ Callback executed successfully for ${message.type} on ${message.channel}`);
        } catch (error) {
          console.error(`🔌 Ultra Simple WebSocket: ❌ Error in callback for ${message.type} on ${message.channel}:`, error);
        }
      } else {
        console.log(`🔌 Ultra Simple WebSocket: ❌ No callback found for ${message.type} on ${message.channel}`);
        console.log(`🔌 Ultra Simple WebSocket: Available callbacks:`, Array.from(callbacks.keys()));
      }
    } else {
      console.log(`🔌 Ultra Simple WebSocket: ❌ No callbacks found for channel ${message.channel}`);
      console.log(`🔌 Ultra Simple WebSocket: Available channels:`, Array.from(this.subscriptions.keys()));
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Ultra Simple WebSocket: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Ultra Simple WebSocket: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Ultra Simple WebSocket: Cannot send message, connection not open');
    }
  }

  subscribe(channel: string) {
    console.log(`🔌 Ultra Simple WebSocket: Subscribing to ${channel}`);

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
    }

    // Ensure connection is initiated and wait for it
    this.connect().then(() => {
      // If authenticated, subscribe immediately; otherwise, queue it
      if (this.authenticatedUserId) {
        console.log(`🔌 Ultra Simple WebSocket: Subscribing to ${channel} immediately (authenticated)`);
        this.sendMessage({ type: 'subscribe', channel });
      } else {
        console.log(`🔌 Ultra Simple WebSocket: Queuing subscription to ${channel} until authenticated`);
        if (!this.pendingSubscriptions.includes(channel)) {
          this.pendingSubscriptions.push(channel);
        }
      }
    }).catch(error => {
      console.error('🔌 Ultra Simple WebSocket: Failed to connect for subscription:', error);
    });

    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Ultra Simple WebSocket: Binding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.set(event, callback);
      },
      unbind: (event: string) => {
        console.log(`🔌 Ultra Simple WebSocket: Unbinding ${event} on ${channel}`);
        this.subscriptions.get(channel)?.delete(event);
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Ultra Simple WebSocket: Unsubscribing from ${channel}`);
    this.subscriptions.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'unsubscribe', channel });
    }
  }

  authenticate(userId: string) {
    // Prevent excessive re-authentication
    if (this.authenticatedUserId === userId) {
      console.log(`🔌 Ultra Simple WebSocket: Already authenticated as ${userId}, skipping`);
      return;
    }

    console.log(`🔌 Ultra Simple WebSocket: Authenticating user ${userId}`);
    this.authenticatedUserId = userId; // Set immediately to prevent race conditions
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'auth', userId });
    } else {
      // Connect first, then authenticate
      this.connect().then(() => {
        this.sendMessage({ type: 'auth', userId });
      }).catch(console.error);
    }
  }

  private processPendingSubscriptions() {
    console.log(`🔌 Ultra Simple WebSocket: Processing ${this.pendingSubscriptions.length} pending subscriptions`);
    for (const channel of this.pendingSubscriptions) {
      console.log(`🔌 Ultra Simple WebSocket: Subscribing to pending channel: ${channel}`);
      this.sendMessage({ type: 'subscribe', channel });
    }
    this.pendingSubscriptions = [];
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
    console.log('🔌 Ultra Simple WebSocket: Destroying client');
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close(1000, 'Client disconnecting');
    }
    this.subscriptions.clear();
    this.pendingSubscriptions = [];
    this.authenticatedUserId = null;
    this.isConnecting = false;
  }
}

// Global singleton instance
let wsClientInstance: UltraSimpleWebSocketClient | null = null;

export function getUltraSimpleWebSocketClient(): UltraSimpleWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__ultraSimpleWsClient) {
      (window as any).__ultraSimpleWsClient = new UltraSimpleWebSocketClient();
    }
    return (window as any).__ultraSimpleWsClient;
  }
  
  if (!wsClientInstance) {
    wsClientInstance = new UltraSimpleWebSocketClient();
  }
  return wsClientInstance;
}

// Export the client instance
export const wsClient = getUltraSimpleWebSocketClient();
