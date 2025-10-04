// Ultra-simple WebSocket - just keep connection alive and deliver messages
class UltraSimpleWebSocket {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxAttempts = 5;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Ultra Simple WS: Client created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Ultra Simple WS: Client created (server-side)');
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
      this.connectionAttempts++;
      console.log(`🔌 Ultra Simple WS: Connecting... (attempt ${this.connectionAttempts})`);

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Ultra Simple WS: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 5000); // 5 second timeout

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('🔌 Ultra Simple WS: Connected successfully');
          this.isConnecting = false;
          this.connectionAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Ultra Simple WS: Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Ultra Simple WS: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Ultra Simple WS: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          
          // Only attempt reconnection if we haven't exceeded max attempts
          if (this.connectionAttempts < this.maxAttempts) {
            console.log(`🔌 Ultra Simple WS: Attempting reconnection in 2 seconds...`);
            setTimeout(() => {
              this.connect().catch(error => {
                console.error('🔌 Ultra Simple WS: Reconnection failed:', error);
              });
            }, 2000);
          } else {
            console.error('🔌 Ultra Simple WS: Max connection attempts reached');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🔌 Ultra Simple WS: Connection error:', error);
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
    // Handle different message types
    if (message.type === 'new-message' && message.channel) {
      const handler = this.messageHandlers.get(message.channel);
      if (handler) {
        console.log(`🔌 Ultra Simple WS: Triggering handler for ${message.channel}`);
        handler(message);
      } else {
        console.log(`🔌 Ultra Simple WS: No handler found for ${message.channel}`);
      }
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Ultra Simple WS: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Ultra Simple WS: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Ultra Simple WS: Cannot send message, connection not open. State:', this.ws?.readyState);
    }
  }

  // Simple subscribe method that returns a channel object (not a promise)
  subscribe(channel: string) {
    console.log(`🔌 Ultra Simple WS: Subscribing to ${channel}`);
    
    // Connect in background if not connected
    this.connect().catch(error => {
      console.error('🔌 Ultra Simple WS: Failed to connect for subscription:', error);
    });
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Ultra Simple WS: Binding ${event} on ${channel}`);
        this.messageHandlers.set(channel, callback);
        
        // Send subscribe message when connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: 'subscribe', channel });
        } else {
          // Queue the subscription for when we connect
          this.connect().then(() => {
            this.sendMessage({ type: 'subscribe', channel });
          }).catch(error => {
            console.error('🔌 Ultra Simple WS: Failed to connect for subscription:', error);
          });
        }
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Ultra Simple WS: Unbinding ${event} on ${channel}`);
        this.messageHandlers.delete(channel);
        this.sendMessage({ type: 'unsubscribe', channel });
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Ultra Simple WS: Unsubscribing from ${channel}`);
    this.messageHandlers.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  authenticate(userId: string) {
    console.log(`🔌 Ultra Simple WS: Authenticating user ${userId}`);
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
    console.log('🔌 Ultra Simple WS: Destroying client');
    if (this.ws) {
      this.ws.close();
    }
    this.messageHandlers.clear();
  }
}

// Global singleton instance
let ultraSimpleWs: UltraSimpleWebSocket | null = null;

export function getUltraSimpleWebSocket(): UltraSimpleWebSocket {
  if (typeof window !== 'undefined') {
    if (!(window as any).__ultraSimpleWs) {
      (window as any).__ultraSimpleWs = new UltraSimpleWebSocket();
    }
    return (window as any).__ultraSimpleWs;
  }
  
  if (!ultraSimpleWs) {
    ultraSimpleWs = new UltraSimpleWebSocket();
  }
  return ultraSimpleWs;
}

export { ultraSimpleWs };
