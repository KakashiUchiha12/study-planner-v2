// Persistent Pusher manager that survives component remounts
import { pusherClient } from './pusher';
import { globalMessageHandler } from './global-message-handler';

class PersistentPusherManager {
  private subscriptions: Map<string, Set<string>> = new Map();
  private isInitialized = false;

  // Initialize the manager
  initialize() {
    if (this.isInitialized) return;
    console.log('🔔 PersistentPusherManager: Initializing persistent manager');
    this.isInitialized = true;
  }

  // Subscribe to a channel and event
  subscribe(channel: string, event: string, callback: (data: any) => void) {
    console.log(`🔔 PersistentPusherManager: Subscribing to ${channel}:${event}`);
    
    // Track this subscription
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(event);

    // Subscribe to the channel
    console.log(`🔔 PersistentPusherManager: Calling pusherClient.subscribe(${channel})`);
    const pusherChannel = pusherClient.subscribe(channel);
    console.log(`🔔 PersistentPusherManager: Got pusher channel:`, pusherChannel);
    
    // Bind the event
    console.log(`🔔 PersistentPusherManager: Binding event ${event} to channel ${channel}`);
    pusherChannel.bind(event, (data: any) => {
      console.log(`🔔 PersistentPusherManager: Received ${channel}:${event}`, data);
      callback(data);
    });

    console.log(`🔔 PersistentPusherManager: Successfully subscribed to ${channel}:${event}`);
    console.log(`🔔 PersistentPusherManager: Current subscriptions:`, this.getSubscriptions());
  }

  // Unsubscribe from a channel and event
  unsubscribe(channel: string, event: string) {
    console.log(`🔔 PersistentPusherManager: Unsubscribing from ${channel}:${event}`);
    
    // Remove from tracking
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel)!.delete(event);
      
      // If no more events for this channel, unsubscribe from the channel
      if (this.subscriptions.get(channel)!.size === 0) {
        pusherClient.unsubscribe(channel);
        this.subscriptions.delete(channel);
        console.log(`🔔 PersistentPusherManager: Unsubscribed from channel ${channel}`);
      }
    }
  }

  // Subscribe to conversation events
  subscribeToConversation(conversationId: string, onNewMessage: (message: any) => void) {
    console.log(`🔔 PersistentPusherManager: Subscribing to conversation ${conversationId}`);
    
    // Subscribe to new messages
    this.subscribe(`conversation-${conversationId}`, 'new-message', (data: { message: any; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        console.log('🔔 PersistentPusherManager: Processing new message for conversation:', data.message);
        
        // Transform the message to match our interface
        const transformedMessage = {
          id: data.message.id,
          content: data.message.content,
          type: data.message.type,
          createdAt: data.message.createdAt,
          editedAt: data.message.editedAt,
          status: 'delivered' as const,
          sender: {
            id: data.message.sender.id,
            name: data.message.sender.name,
            image: data.message.sender.image,
          },
          replyTo: data.message.replyTo,
          attachments: data.message.attachments || [],
          reactions: data.message.reactions || [],
        };
        
        // Use the global handler
        globalMessageHandler.handleMessage(transformedMessage, conversationId);
        
        // Also call the callback directly
        onNewMessage(transformedMessage);
      }
    });

    // Subscribe to conversation updates
    this.subscribe('conversation-updates', 'new-message', (data: { message: any; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        console.log('🔔 PersistentPusherManager: Processing conversation update for conversation:', data.message);
        
        // Transform the message
        const transformedMessage = {
          id: data.message.id,
          content: data.message.content,
          type: data.message.type,
          createdAt: data.message.createdAt,
          editedAt: data.message.editedAt,
          status: 'delivered' as const,
          sender: {
            id: data.message.sender.id,
            name: data.message.sender.name,
            image: data.message.sender.image,
          },
          replyTo: data.message.replyTo,
          attachments: data.message.attachments || [],
          reactions: data.message.reactions || [],
        };
        
        // Use the global handler
        globalMessageHandler.handleMessage(transformedMessage, conversationId);
        
        // Also call the callback directly
        onNewMessage(transformedMessage);
      }
    });
  }

  // Unsubscribe from conversation events
  unsubscribeFromConversation(conversationId: string) {
    console.log(`🔔 PersistentPusherManager: Unsubscribing from conversation ${conversationId}`);
    
    this.unsubscribe(`conversation-${conversationId}`, 'new-message');
    this.unsubscribe('conversation-updates', 'new-message');
  }

  // Get current subscription count for debugging
  getSubscriptionCount() {
    let total = 0;
    for (const events of this.subscriptions.values()) {
      total += events.size;
    }
    return total;
  }

  // Get current subscriptions for debugging
  getSubscriptions() {
    const result: { [channel: string]: string[] } = {};
    for (const [channel, events] of this.subscriptions) {
      result[channel] = Array.from(events);
    }
    return result;
  }
}

// Global instance
export const persistentPusherManager = new PersistentPusherManager();

// Make it available on window for debugging
if (typeof window !== 'undefined') {
  (window as any).persistentPusherManager = persistentPusherManager;
}

