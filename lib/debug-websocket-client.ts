// Debug WebSocket client - logs everything to see what's happening
class DebugWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxAttempts = 3;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Debug WebSocket Client: Created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Debug WebSocket Client: Created (server-side)');
    }
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        console.log('🔌 Debug WebSocket Client: Already connecting, skipping');
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('🔌 Debug WebSocket Client: Already connected');
        resolve();
        return;
      }

      this.isConnecting = true;
      this.connectionAttempts++;
      console.log(`🔌 Debug WebSocket Client: Connecting to ${this.connectionUrl} (attempt ${this.connectionAttempts})`);

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Debug WebSocket Client: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Debug WebSocket Client: Connected successfully', event);
          this.isConnecting = false;
          this.connectionAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Debug WebSocket Client: Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Debug WebSocket Client: Error parsing message:', error);
            console.error('🔌 Debug WebSocket Client: Raw data:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Debug WebSocket Client: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            type: event.type
          });
          this.isConnecting = false;
          
          // Only attempt reconnection if we haven't exceeded max attempts
          if (this.connectionAttempts < this.maxAttempts) {
            console.log(`🔌 Debug WebSocket Client: Attempting reconnection in 3 seconds...`);
            setTimeout(() => {
              this.connect().catch(error => {
                console.error('🔌 Debug WebSocket Client: Reconnection failed:', error);
              });
            }, 3000);
          } else {
            console.error('🔌 Debug WebSocket Client: Max connection attempts reached');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🔌 Debug WebSocket Client: Connection error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('🔌 Debug WebSocket Client: Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    console.log('🔌 Debug WebSocket Client: Handling message:', message);
    
    // Handle different message types
    if (message.type === 'new-message' && message.channel) {
      const handler = this.messageHandlers.get(message.channel);
      if (handler) {
        console.log(`🔌 Debug WebSocket Client: Triggering handler for ${message.channel}`);
        handler(message);
      } else {
        console.log(`🔌 Debug WebSocket Client: No handler found for ${message.channel}`);
      }
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Debug WebSocket Client: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Debug WebSocket Client: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Debug WebSocket Client: Cannot send message, connection not open. State:', this.ws?.readyState);
    }
  }

  // Simple subscribe method that returns a channel object (not a promise)
  subscribe(channel: string) {
    console.log(`🔌 Debug WebSocket Client: Subscribing to ${channel}`);
    
    // Connect in background if not connected
    this.connect().catch(error => {
      console.error('🔌 Debug WebSocket Client: Failed to connect for subscription:', error);
    });
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Debug WebSocket Client: Binding ${event} on ${channel}`);
        this.messageHandlers.set(channel, callback);
        
        // Send subscribe message when connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'subscribe', channel });
        } else {
          // Queue the subscription for when we connect
          this.connect().then(() => {
            this.sendMessage({ type: 'subscribe', channel });
          }).catch(error => {
            console.error('🔌 Debug WebSocket Client: Failed to connect for subscription:', error);
          });
        }
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Debug WebSocket Client: Unbinding ${event} on ${channel}`);
        this.messageHandlers.delete(channel);
        this.sendMessage({ type: 'unsubscribe', channel });
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Debug WebSocket Client: Unsubscribing from ${channel}`);
    this.messageHandlers.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  authenticate(userId: string) {
    console.log(`🔌 Debug WebSocket Client: Authenticating user ${userId}`);
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
    console.log('🔌 Debug WebSocket Client: Destroying client');
    if (this.ws) {
      this.ws.close();
    }
    this.messageHandlers.clear();
  }
}

// Global singleton instance
let debugWsClient: DebugWebSocketClient | null = null;

export function getDebugWebSocketClient(): DebugWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__debugWsClient) {
      (window as any).__debugWsClient = new DebugWebSocketClient();
    }
    return (window as any).__debugWsClient;
  }
  
  if (!debugWsClient) {
    debugWsClient = new DebugWebSocketClient();
  }
  return debugWsClient;
}

export { debugWsClient };
