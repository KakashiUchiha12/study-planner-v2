const { WebSocketServer } = require('ws');

class StudyPlannerWebSocketServer {
  constructor() {
    this.wss = null;
    this.connections = new Map();
    this.userConnections = new Map();
    this.connectionUsers = new Map();
    this.channelSubscriptions = new Map();
    this.connectionChannels = new Map();
  }

  initialize(server) {
    if (this.wss) {
      console.log('🔌 WebSocket Server: Already initialized');
      return;
    }

    console.log('🔌 WebSocket Server: Initializing...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws',
      perMessageDeflate: false,
      maxPayload: 1024 * 1024,
      verifyClient: false, // Disable for development
    });

    this.wss.on('connection', (ws, request) => {
      const connectionId = Math.random().toString(36).substring(2, 15);
      console.log('🔌 WebSocket Server: New connection', {
        id: connectionId,
        origin: request.headers.origin,
        url: request.url
      });
      
      this.connections.set(connectionId, ws);

      // Send welcome message after a small delay to ensure connection is stable
      setTimeout(() => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(JSON.stringify({
              type: 'connected',
              connectionId,
              timestamp: Date.now()
            }));
            console.log(`🔌 WebSocket Server: Welcome sent to ${connectionId}`);
          } catch (error) {
            console.error(`🔌 WebSocket Server: Error sending welcome:`, error);
          }
        } else {
          console.log(`🔌 WebSocket Server: Connection ${connectionId} not ready for welcome message, state: ${ws.readyState}`);
        }
      }, 100); // 100ms delay

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`🔌 WebSocket Server: Message from ${connectionId}:`, message.type);
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error(`🔌 WebSocket Server: Error parsing message:`, error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log('🔌 WebSocket Server: Connection closed', {
          id: connectionId,
          code,
          reason: reason.toString(),
          wasClean: code === 1000
        });
        this.handleDisconnection(connectionId);
      });

      ws.on('error', (error) => {
        console.error('🔌 WebSocket Server: WebSocket error', {
          id: connectionId,
          error: error.message,
          code: error.code,
          readyState: ws.readyState
        });
      });
    });

    console.log('🔌 WebSocket Server: Initialized on /api/ws');
  }

  handleMessage(connectionId, message) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(connectionId, message.userId);
        break;
      case 'subscribe':
        this.handleSubscribe(connectionId, message.channel);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(connectionId, message.channel);
        break;
      case 'ping':
        this.handlePing(connectionId);
        break;
      default:
        console.log(`🔌 WebSocket Server: Unknown message type: ${message.type}`);
    }
  }

  handleAuth(connectionId, userId) {
    console.log(`🔌 WebSocket Server: Auth for ${connectionId}, user ${userId}`);
    
    this.connectionUsers.set(connectionId, userId);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId).add(connectionId);

    this.sendToConnection(connectionId, {
      type: 'auth_success',
      userId,
      timestamp: Date.now()
    });
  }

  handleSubscribe(connectionId, channel) {
    console.log(`🔌 WebSocket Server: ${connectionId} subscribed to ${channel}`);
    
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel).add(connectionId);

    if (!this.connectionChannels.has(connectionId)) {
      this.connectionChannels.set(connectionId, new Set());
    }
    this.connectionChannels.get(connectionId).add(channel);
  }

  handleUnsubscribe(connectionId, channel) {
    console.log(`🔌 WebSocket Server: ${connectionId} unsubscribed from ${channel}`);
    
    if (this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.get(channel).delete(connectionId);
      if (this.channelSubscriptions.get(channel).size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }

    if (this.connectionChannels.has(connectionId)) {
      this.connectionChannels.get(connectionId).delete(channel);
      if (this.connectionChannels.get(connectionId).size === 0) {
        this.connectionChannels.delete(connectionId);
      }
    }
  }

  handlePing(connectionId) {
    this.sendToConnection(connectionId, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  sendToConnection(connectionId, message) {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      console.warn(`🔌 WebSocket Server: Connection ${connectionId} not found`);
      return false;
    }
    
    if (ws.readyState !== 1) { // WebSocket.OPEN
      console.warn(`🔌 WebSocket Server: Connection ${connectionId} not open, state: ${ws.readyState}`);
      return false;
    }
    
    try {
      ws.send(JSON.stringify(message));
      console.log(`🔌 WebSocket Server: Message sent to ${connectionId}:`, message.type);
      return true;
    } catch (error) {
      console.error(`🔌 WebSocket Server: Error sending message to ${connectionId}:`, error);
      return false;
    }
  }

  broadcastToChannel(channel, message) {
    console.log(`🔌 WebSocket Server: Broadcasting to ${channel}`);
    
    const subscribers = this.channelSubscriptions.get(channel);
    if (!subscribers || subscribers.size === 0) {
      console.log(`🔌 WebSocket Server: No subscribers for ${channel}`);
      return 0;
    }

    let sentCount = 0;
    for (const connectionId of subscribers) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    console.log(`🔌 WebSocket Server: Sent to ${sentCount} connections on ${channel}`);
    return sentCount;
  }

  handleDisconnection(connectionId) {
    const userId = this.connectionUsers.get(connectionId);

    if (userId && this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(connectionId);
      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
    }

    const subscribedChannels = this.connectionChannels.get(connectionId);
    if (subscribedChannels) {
      for (const channel of subscribedChannels) {
        if (this.channelSubscriptions.has(channel)) {
          this.channelSubscriptions.get(channel).delete(connectionId);
          if (this.channelSubscriptions.get(channel).size === 0) {
            this.channelSubscriptions.delete(channel);
          }
        }
      }
      this.connectionChannels.delete(connectionId);
    }

    this.connections.delete(connectionId);
    this.connectionUsers.delete(connectionId);
    console.log(`🔌 WebSocket Server: Cleaned up ${connectionId}`);
  }

  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      totalChannels: this.channelSubscriptions.size,
    };
  }
}

const webSocketServer = new StudyPlannerWebSocketServer();

module.exports = { webSocketServer };
