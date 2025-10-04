// WebSocket-based server for triggering events (replaces Pusher server)
// This avoids circular imports by using dynamic imports

class WebSocketServer {
  async trigger(channel: string, event: string, data: any) {
    console.log(`🔌 WebSocket Server: TRIGGERING ${channel}:${event}`, data);
    
    try {
      // Dynamic import to avoid circular dependencies
      const { broadcastMessage, broadcastToUser } = await import('./socketio-broadcaster.js');
      
      // Broadcast to the appropriate channel
      if (channel.startsWith('conversation-')) {
        const conversationId = channel.replace('conversation-', '');
        broadcastMessage(conversationId, {
          type: event,
          ...data
        });
      } else if (channel.startsWith('user-')) {
        const userId = channel.replace('user-', '');
        broadcastToUser(userId, event, data);
      }
    } catch (error) {
      console.error('🔌 WebSocket Server: Error triggering event:', error);
    }
  }
}

const wsServer = new WebSocketServer();

// Export the WebSocket server (replaces pusherServer)
export const pusherServer = wsServer;

// Add methods to check and manage instance identity
if (typeof global !== 'undefined') {
  (global as any).checkWebSocketInstance = () => {
    console.log('🔌 WebSocket: Checking instance identity');
    console.log('🔌 WebSocket: pusherServer type:', typeof pusherServer);
  };

  (global as any).resetWebSocketInstance = () => {
    console.log('🔌 WebSocket: Resetting global instance');
    console.log('🔌 WebSocket: Reset complete');
  };
}