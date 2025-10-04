#!/usr/bin/env node

// Start the WebSocket server
console.log('🚀 Starting WebSocket server...');

// Import the server functions
const { WebSocketServer } = require('ws');
const { createServer } = require('http');

const port = 3001;

console.log('🔌 Starting production WebSocket server...');

// Create HTTP server
const server = createServer();

// Create WebSocket server with minimal config
const wss = new WebSocketServer({ 
  server,
  path: '/api/ws',
  perMessageDeflate: false,
  maxPayload: 1024 * 1024,
  verifyClient: false,
});

// Connection tracking
const connections = new Map();
const userConnections = new Map();
const connectionUsers = new Map();
const channelSubscriptions = new Map();
const connectionChannels = new Map();

wss.on('connection', (ws, request) => {
  const connectionId = Math.random().toString(36).substring(2, 15);
  console.log('🔌 Production Server: New connection', {
    id: connectionId,
    origin: request.headers.origin,
    url: request.url
  });

  connections.set(connectionId, ws);

  // Send welcome message after a small delay
  setTimeout(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({
          type: 'connected',
          connectionId,
          timestamp: Date.now()
        }));
        console.log(`🔌 Production Server: Welcome sent to ${connectionId}`);
      } catch (error) {
        console.error(`🔌 Production Server: Error sending welcome:`, error);
      }
    } else {
      console.log(`🔌 Production Server: Connection ${connectionId} not ready, state: ${ws.readyState}`);
    }
  }, 100);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`🔌 Production Server: Message from ${connectionId}:`, message.type);
      handleMessage(connectionId, message);
    } catch (error) {
      console.error(`🔌 Production Server: Error parsing message:`, error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log('🔌 Production Server: Connection closed', {
      id: connectionId,
      code,
      reason: reason.toString(),
      wasClean: code === 1000
    });
    handleDisconnection(connectionId);
  });

  ws.on('error', (error) => {
    console.error('🔌 Production Server: WebSocket error', {
      id: connectionId,
      error: error.message,
      code: error.code,
      readyState: ws.readyState
    });
  });
});

function handleMessage(connectionId, message) {
  switch (message.type) {
    case 'auth':
      handleAuth(connectionId, message.userId);
      break;
    case 'subscribe':
      handleSubscribe(connectionId, message.channel);
      break;
    case 'unsubscribe':
      handleUnsubscribe(connectionId, message.channel);
      break;
    case 'ping':
      handlePing(connectionId);
      break;
    case 'typing':
      handleTyping(connectionId, message);
      break;
    case 'typing_stop':
      handleTypingStop(connectionId, message);
      break;
    case 'presence':
      handlePresence(connectionId, message);
      break;
    case 'broadcast':
      handleBroadcast(connectionId, message);
      break;
    default:
      console.log(`🔌 Production Server: Unknown message type: ${message.type}`);
  }
}

function handleAuth(connectionId, userId) {
  console.log(`🔌 Production Server: Auth for ${connectionId}, user ${userId}`);
  connectionUsers.set(connectionId, userId);
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(connectionId);
  sendToConnection(connectionId, { type: 'auth_success', userId, timestamp: Date.now() });
}

function handleSubscribe(connectionId, channel) {
  console.log(`🔌 Production Server: ${connectionId} subscribed to ${channel}`);
  if (!channelSubscriptions.has(channel)) {
    channelSubscriptions.set(channel, new Set());
  }
  channelSubscriptions.get(channel).add(connectionId);
  if (!connectionChannels.has(connectionId)) {
    connectionChannels.set(connectionId, new Set());
  }
  connectionChannels.get(connectionId).add(channel);
}

function handleUnsubscribe(connectionId, channel) {
  console.log(`🔌 Production Server: ${connectionId} unsubscribed from ${channel}`);
  if (channelSubscriptions.has(channel)) {
    channelSubscriptions.get(channel).delete(connectionId);
    if (channelSubscriptions.get(channel).size === 0) {
      channelSubscriptions.delete(channel);
    }
  }
  if (connectionChannels.has(connectionId)) {
    connectionChannels.get(connectionId).delete(channel);
    if (connectionChannels.get(connectionId).size === 0) {
      connectionChannels.delete(connectionId);
    }
  }
}

function handlePing(connectionId) {
  console.log(`🔌 Production Server: Ping from ${connectionId}`);
  sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
}

function handleTyping(connectionId, message) {
  console.log(`🔌 Production Server: Typing from ${connectionId} in ${message.conversationId}`);
  // Broadcast typing event to conversation subscribers
  const typingChannel = `typing-${message.conversationId}`;
  broadcastToChannel(typingChannel, {
    type: 'user_typing',
    conversationId: message.conversationId,
    userId: message.userId || connectionUsers.get(connectionId),
    userName: message.userName,
    userImage: message.userImage,
    timestamp: Date.now()
  });
}

function handleTypingStop(connectionId, message) {
  console.log(`🔌 Production Server: Typing stop from ${connectionId} in ${message.conversationId}`);
  // Broadcast typing stop event to conversation subscribers
  const typingChannel = `typing-${message.conversationId}`;
  broadcastToChannel(typingChannel, {
    type: 'user_stopped_typing',
    conversationId: message.conversationId,
    userId: message.userId || connectionUsers.get(connectionId),
    timestamp: Date.now()
  });
}

function handlePresence(connectionId, message) {
  console.log(`🔌 Production Server: Presence from ${connectionId} in ${message.conversationId}`);
  // Broadcast presence event to conversation subscribers
  const presenceChannel = `presence-${message.conversationId}`;
  broadcastToChannel(presenceChannel, {
    type: 'presence',
    conversationId: message.conversationId,
    isOnline: message.isOnline,
    timestamp: Date.now()
  });
}

function handleBroadcast(connectionId, message) {
  console.log(`🔌 Production Server: Broadcast from ${connectionId} to ${message.channel}`);
  // Broadcast the message to the specified channel
  broadcastToChannel(message.channel, message.message);
}

function sendToConnection(connectionId, message) {
  const ws = connections.get(connectionId);
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

function broadcastToChannel(channel, message) {
  console.log(`🔌 Production Server: Broadcasting to ${channel}`);
  console.log(`🔌 Production Server: Message:`, JSON.stringify(message, null, 2));
  const subscribers = channelSubscriptions.get(channel);
  if (subscribers) {
    console.log(`🔌 Production Server: Found ${subscribers.size} subscribers for ${channel}`);
    // Add channel information to the message
    const messageWithChannel = {
      ...message,
      channel: channel
    };
    for (const connectionId of subscribers) {
      console.log(`🔌 Production Server: Sending to connection ${connectionId}`);
      sendToConnection(connectionId, messageWithChannel);
    }
  } else {
    console.log(`🔌 Production Server: No subscribers for channel ${channel}`);
    console.log(`🔌 Production Server: Available channels:`, Array.from(channelSubscriptions.keys()));
  }
}

function handleDisconnection(connectionId) {
  console.log(`🔌 Production Server: Cleaned up ${connectionId}`);
  const userId = connectionUsers.get(connectionId);
  if (userId && userConnections.has(userId)) {
    userConnections.get(userId).delete(connectionId);
    if (userConnections.get(userId).size === 0) {
      userConnections.delete(userId);
    }
  }
  const subscribedChannels = connectionChannels.get(connectionId);
  if (subscribedChannels) {
    for (const channel of subscribedChannels) {
      if (channelSubscriptions.has(channel)) {
        channelSubscriptions.get(channel).delete(connectionId);
        if (channelSubscriptions.get(channel).size === 0) {
          channelSubscriptions.delete(channel);
        }
      }
    }
    connectionChannels.delete(connectionId);
  }
  connections.delete(connectionId);
  connectionUsers.delete(connectionId);
}

function getConnectionStats() {
  return {
    totalConnections: connections.size,
    totalUsers: userConnections.size,
    totalChannels: channelSubscriptions.size,
  };
}

// Export for use by other modules
module.exports = {
  broadcastToChannel,
  getConnectionStats
};

// Make broadcast function available globally for Next.js integration
if (typeof global !== 'undefined') {
  global.standaloneBroadcast = broadcastToChannel;
  global.getStandaloneStats = getConnectionStats;
}

// Start the server
server.listen(port, () => {
  console.log(`🔌 Production WebSocket server running on ws://localhost:${port}/api/ws`);
  console.log('🔌 Ready to handle connections and messages');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});
