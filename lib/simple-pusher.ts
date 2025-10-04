// Simple Pusher implementation for development
// This creates separate instances for server and client, but uses a simple approach

class SimplePusher {
  private instanceId: string;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.instanceId = 'simple-pusher-' + Math.random().toString(36).substring(2, 8);
    console.log(`🔔 SimplePusher: Created with ID: ${this.instanceId}`);
  }

  async trigger(channel: string, event: string, data: any) {
    const eventKey = `${channel}:${event}`;
    console.log(`🔔 SimplePusher [${this.instanceId}]: TRIGGERING ${eventKey}`, data);
    
    // For development, we'll use a simple approach:
    // Server triggers events, client listens via direct function calls
    if (typeof window !== 'undefined') {
      // Client-side: trigger events directly
      this.emit(eventKey, data);
    } else {
      // Server-side: just log the event
      console.log(`🔔 SimplePusher [${this.instanceId}]: Server triggered ${eventKey}`);
    }
  }

  private emit(eventKey: string, data: any) {
    const listeners = this.listeners.get(eventKey) || [];
    console.log(`🔔 SimplePusher [${this.instanceId}]: Emitting ${eventKey} to ${listeners.length} listeners`);
    
    if (listeners.length === 0) {
      console.log(`🔔 SimplePusher [${this.instanceId}]: ❌ NO LISTENERS FOUND for ${eventKey}`);
    } else {
      console.log(`🔔 SimplePusher [${this.instanceId}]: ✅ Triggering ${listeners.length} listeners for ${eventKey}`);
      listeners.forEach((callback, index) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔔 SimplePusher [${this.instanceId}]: Error in listener ${index + 1}:`, error);
        }
      });
    }
  }

  addEventListener(channel: string, event: string, callback: (data: any) => void) {
    const eventKey = `${channel}:${event}`;
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, []);
    }
    this.listeners.get(eventKey)!.push(callback);
    console.log(`🔔 SimplePusher [${this.instanceId}]: Added listener for ${eventKey}. Total: ${this.listeners.get(eventKey)!.length}`);
  }

  removeEventListener(channel: string, event: string, callback: (data: any) => void) {
    const eventKey = `${channel}:${event}`;
    const listeners = this.listeners.get(eventKey) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`🔔 SimplePusher [${this.instanceId}]: Removed listener for ${eventKey}. Remaining: ${listeners.length}`);
    }
  }

  getInstanceId() {
    return this.instanceId;
  }
}

class SimplePusherClient {
  private clientId: string;
  private mockPusher: SimplePusher;
  private subscriptions: Map<string, any> = new Map();
  private boundCallbacks = new Map<string, Map<string, ((data: any) => void)[]>>();

  constructor(mockPusher: SimplePusher) {
    this.clientId = Math.random().toString(36).substring(2, 11);
    this.mockPusher = mockPusher;
    console.log(`🔔 SimplePusherClient: Created client with ID: ${this.clientId}`);
  }

  subscribe(channel: string) {
    console.log(`🔔 SimplePusherClient [${this.clientId}]: Subscribed to ${channel}`);
    if (this.subscriptions.has(channel)) {
      return this.subscriptions.get(channel);
    }

    const mockChannel = {
      bind: (event: string, callback: (data: any) => void) => {
        console.log(`🔔 SimplePusherClient [${this.clientId}]: Binding ${event} on ${channel}`);
        this.mockPusher.addEventListener(channel, event, callback);

        if (!this.boundCallbacks.has(channel)) {
          this.boundCallbacks.set(channel, new Map());
        }
        if (!this.boundCallbacks.get(channel)!.has(event)) {
          this.boundCallbacks.get(channel)!.set(event, []);
        }
        this.boundCallbacks.get(channel)!.get(event)!.push(callback);
      },
      unbind: (event: string, callback?: (data: any) => void) => {
        console.log(`🔔 SimplePusherClient [${this.clientId}]: Unbinding ${event} on ${channel}`);
        if (callback) {
          this.mockPusher.removeEventListener(channel, event, callback);
          const callbacksForEvent = this.boundCallbacks.get(channel)?.get(event);
          if (callbacksForEvent) {
            const index = callbacksForEvent.indexOf(callback);
            if (index > -1) {
              callbacksForEvent.splice(index, 1);
            }
          }
        }
      }
    };
    this.subscriptions.set(channel, mockChannel);
    return mockChannel;
  }

  unsubscribe(channel: string) {
    console.log(`🔔 SimplePusherClient [${this.clientId}]: Unsubscribed from ${channel}`);
    const channelCallbacks = this.boundCallbacks.get(channel);
    if (channelCallbacks) {
      channelCallbacks.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.mockPusher.removeEventListener(channel, event, callback);
        });
      });
      this.boundCallbacks.delete(channel);
    }
    this.subscriptions.delete(channel);
  }
}

// Create instances
const simplePusher = new SimplePusher();
const simplePusherClient = new SimplePusherClient(simplePusher);

export { simplePusher as pusherServer, simplePusherClient as pusherClient };
