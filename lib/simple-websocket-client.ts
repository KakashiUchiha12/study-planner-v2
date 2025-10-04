// Simplified WebSocket client for testing
class SimpleWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionUrl: string;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.connectionUrl = `${protocol}//${window.location.host}/api/ws`;
      console.log('🔌 Simple WebSocket Client: Created with URL:', this.connectionUrl);
    } else {
      this.connectionUrl = 'ws://localhost:3000/api/ws';
    }
  }

  connect(): Promise<void> {
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
      console.log('🔌 Simple WebSocket Client: Connecting...');

      try {
        this.ws = new WebSocket(this.connectionUrl);

        this.ws.onopen = (event) => {
          console.log('🔌 Simple WebSocket Client: Connected successfully');
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('🔌 Simple WebSocket Client: Received:', message);
          } catch (error) {
            console.error('🔌 Simple WebSocket Client: Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Simple WebSocket Client: Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
        };

        this.ws.onerror = (error) => {
          console.error('🔌 Simple WebSocket Client: Connection error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('🔌 Simple WebSocket Client: Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.log('🔌 Simple WebSocket Client: Sending:', message);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('🔌 Simple WebSocket Client: Error sending message:', error);
      }
    } else {
      console.warn('🔌 Simple WebSocket Client: Cannot send message, connection not open');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Global singleton
let simpleWsClientInstance: SimpleWebSocketClient | null = null;

export function getSimpleWebSocketClient(): SimpleWebSocketClient {
  if (typeof window !== 'undefined') {
    if (!(window as any).__simpleWsClient) {
      (window as any).__simpleWsClient = new SimpleWebSocketClient();
    }
    return (window as any).__simpleWsClient;
  }
  
  if (!simpleWsClientInstance) {
    simpleWsClientInstance = new SimpleWebSocketClient();
  }
  return simpleWsClientInstance;
}

export const simpleWsClient = getSimpleWebSocketClient();