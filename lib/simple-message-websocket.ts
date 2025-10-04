// Dead simple WebSocket for message delivery only
class SimpleMessageWebSocket {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Simple Message WS: Client created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
      console.log('🔌 Simple Message WS: Client created (server-side)');
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
      console.log('🔌 Simple Message WS: Connecting...');

      try {
        this.ws = new WebSocket(this.connectionUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('🔌 Simple Message WS: Connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 3000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('🔌 Simple Message WS: Connected successfully');
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Simple Message WS: Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('🔌 Simple Message WS: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('🔌 Simple Message WS: Disconnected', {
            code: event.code,
            reason: event.reason
          });
          this.isConnecting = false;
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🔌 Simple Message WS: Connection error:', error);
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
        handler(message);
      }
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Simple Message WS: Sending message:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Simple Message WS: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Simple Message WS: Cannot send message, connection not open');
    }
  }

  // Simple subscribe method that returns a channel object (not a promise)
  subscribe(channel: string) {
    console.log(`🔌 Simple Message WS: Subscribing to ${channel}`);
    
    // Connect in background if not connected
    this.connect().catch(error => {
      console.error('🔌 Simple Message WS: Failed to connect for subscription:', error);
    });
    
    return {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔌 Simple Message WS: Binding ${event} on ${channel}`);
        this.messageHandlers.set(channel, callback);
        
        // Send subscribe message
        this.sendMessage({ type: 'subscribe', channel });
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔌 Simple Message WS: Unbinding ${event} on ${channel}`);
        this.messageHandlers.delete(channel);
        this.sendMessage({ type: 'unsubscribe', channel });
      }
    };
  }

  unsubscribe(channel: string) {
    console.log(`🔌 Simple Message WS: Unsubscribing from ${channel}`);
    this.messageHandlers.delete(channel);
    this.sendMessage({ type: 'unsubscribe', channel });
  }

  authenticate(userId: string) {
    console.log(`🔌 Simple Message WS: Authenticating user ${userId}`);
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
    console.log('🔌 Simple Message WS: Destroying client');
    if (this.ws) {
      this.ws.close();
    }
    this.messageHandlers.clear();
  }
}

// Global singleton instance
let simpleMessageWs: SimpleMessageWebSocket | null = null;

export function getSimpleMessageWebSocket(): SimpleMessageWebSocket {
  if (typeof window !== 'undefined') {
    if (!(window as any).__simpleMessageWs) {
      (window as any).__simpleMessageWs = new SimpleMessageWebSocket();
    }
    return (window as any).__simpleMessageWs;
  }
  
  if (!simpleMessageWs) {
    simpleMessageWs = new SimpleMessageWebSocket();
  }
  return simpleMessageWs;
}

export { simpleMessageWs };
