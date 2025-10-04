// Global message handler that persists across component remounts
class GlobalMessageHandler {
  private handlers: Map<string, (message: any) => void> = new Map();
  private messageQueue: any[] = [];

  // Register a handler for a specific conversation
  registerHandler(conversationId: string, handler: (message: any) => void) {
    console.log('🔔 GlobalMessageHandler: Registering handler for conversation:', conversationId);
    this.handlers.set(conversationId, handler);
    
    // Process any queued messages for this conversation
    this.processQueuedMessages(conversationId);
  }

  // Unregister a handler for a specific conversation
  unregisterHandler(conversationId: string) {
    console.log('🔔 GlobalMessageHandler: Unregistering handler for conversation:', conversationId);
    this.handlers.delete(conversationId);
  }

  // Handle a new message
  handleMessage(message: any, conversationId: string) {
    console.log('🔔 GlobalMessageHandler: Handling message for conversation:', conversationId, message);
    
    const handler = this.handlers.get(conversationId);
    if (handler) {
      console.log('🔔 GlobalMessageHandler: Found handler, processing immediately');
      handler(message);
    } else {
      console.log('🔔 GlobalMessageHandler: No handler found, queuing message');
      this.messageQueue.push({ message, conversationId, timestamp: Date.now() });
      
      // Clean up old queued messages (older than 30 seconds)
      this.messageQueue = this.messageQueue.filter(
        item => Date.now() - item.timestamp < 30000
      );
    }
  }

  // Process queued messages for a conversation
  private processQueuedMessages(conversationId: string) {
    const queuedMessages = this.messageQueue.filter(
      item => item.conversationId === conversationId
    );
    
    if (queuedMessages.length > 0) {
      console.log('🔔 GlobalMessageHandler: Processing', queuedMessages.length, 'queued messages for conversation:', conversationId);
      
      const handler = this.handlers.get(conversationId);
      if (handler) {
        queuedMessages.forEach(item => {
          handler(item.message);
        });
        
        // Remove processed messages from queue
        this.messageQueue = this.messageQueue.filter(
          item => item.conversationId !== conversationId
        );
      }
    }
  }

  // Get current handler count for debugging
  getHandlerCount() {
    return this.handlers.size;
  }

  // Get current queue size for debugging
  getQueueSize() {
    return this.messageQueue.length;
  }
}

// Global instance
export const globalMessageHandler = new GlobalMessageHandler();

// Make it available on window for debugging
if (typeof window !== 'undefined') {
  (window as any).globalMessageHandler = globalMessageHandler;
}
