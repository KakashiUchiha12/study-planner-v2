#!/usr/bin/env node

const { Server } = require('socket.io');
const { createServer } = require('http');

console.log('🚀 Starting Socket.IO server...');

const port = 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  path: '/socket.io/'
});

// Store user connections and room memberships
const userConnections = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId
const roomMembers = new Map(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`🔌 Socket.IO: New connection ${socket.id}`);
  
  // Log all events for debugging
  socket.onAny((eventName, ...args) => {
    console.log(`🔌 Socket.IO: Received event '${eventName}' from socket ${socket.id}`);
    if (eventName === 'broadcast-message') {
      console.log(`🔌 Socket.IO: BROADCAST-MESSAGE EVENT DETECTED!`);
      console.log(`🔌 Socket.IO: Args:`, args);
      console.log(`🔌 Socket.IO: Socket user: ${socketUsers.get(socket.id)}`);
    }
  });

  // Handle user authentication
  socket.on('authenticate', (data) => {
    const { userId } = data;
    console.log(`🔌 Socket.IO: User ${userId} authenticated with socket ${socket.id}`);
    
    // Store user connection
    userConnections.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    
    // Join user to their personal room
    socket.join(`user-${userId}`);
    
    socket.emit('authenticated', { userId, socketId: socket.id });
  });

  // Handle joining a conversation room
  socket.on('join-conversation', (data) => {
    const { conversationId } = data;
    const userId = socketUsers.get(socket.id);
    
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    console.log(`🔌 Socket.IO: User ${userId} joining conversation ${conversationId}`);
    
    // Join the conversation room
    socket.join(`conversation-${conversationId}`);
    
    // Track room membership
    if (!roomMembers.has(conversationId)) {
      roomMembers.set(conversationId, new Set());
    }
    roomMembers.get(conversationId).add(socket.id);
    
    socket.emit('joined-conversation', { conversationId });
  });

  // Handle leaving a conversation room
  socket.on('leave-conversation', (data) => {
    const { conversationId } = data;
    const userId = socketUsers.get(socket.id);
    
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    console.log(`🔌 Socket.IO: User ${userId} leaving conversation ${conversationId}`);
    
    // Leave the conversation room
    socket.leave(`conversation-${conversationId}`);
    
    // Update room membership
    if (roomMembers.has(conversationId)) {
      roomMembers.get(conversationId).delete(socket.id);
      if (roomMembers.get(conversationId).size === 0) {
        roomMembers.delete(conversationId);
      }
    }
    
    socket.emit('left-conversation', { conversationId });
  });

  // Handle new messages
  socket.on('new-message', (data) => {
    const { conversationId, message } = data;
    const userId = socketUsers.get(socket.id);
    
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    console.log(`🔌 Socket.IO: Broadcasting message to conversation ${conversationId}`);
    
    // Broadcast message to all users in the conversation (except sender)
    socket.to(`conversation-${conversationId}`).emit('message-received', {
      conversationId,
      message,
      senderId: userId
    });
  });

  // Handle broadcasts to specific users (from the Next.js app)
  socket.on('broadcast-to-user', (data) => {
    const { userId, event, data: eventData } = data;
    console.log(`🔌 Socket.IO: Broadcasting to user ${userId}, event: ${event}`);
    
    // Send the event to the specific user's room
    io.to(`user-${userId}`).emit(event, eventData);
  });

  // Handle message broadcasts from the Next.js app (external broadcaster)
  socket.on('broadcast-message', (data, callback) => {
    console.log(`🔌 Socket.IO: ========== RECEIVED BROADCAST-MESSAGE EVENT ==========`);
    console.log(`🔌 Socket.IO: Socket ID: ${socket.id}`);
    console.log(`🔌 Socket.IO: Socket user: ${socketUsers.get(socket.id)}`);
    console.log(`🔌 Socket.IO: Data received:`, JSON.stringify(data, null, 2));
    const { conversationId, message } = data;
    console.log(`🔌 Socket.IO: Broadcasting external message to conversation ${conversationId}`);
    
    // Broadcast message to all users in the conversation
    io.to(`conversation-${conversationId}`).emit('message-received', {
      conversationId,
      message,
      senderId: message.senderId || 'system'
    });
    
    console.log(`🔌 Socket.IO: Message broadcasted to conversation-${conversationId}`);
    
    // Send acknowledgment back to broadcaster
    if (callback) {
      callback({ success: true, message: 'Message broadcasted successfully' });
    }
  });

  // Handle ping for connection testing
  socket.on('ping', (data, callback) => {
    console.log(`🔌 Socket.IO: Received ping from socket ${socket.id}`);
    if (callback) {
      callback({ pong: true, timestamp: Date.now(), socketId: socket.id });
    }
  });

  // Handle broadcast-message from the Next.js app
  socket.on('broadcast-message', (data, callback) => {
    console.log('🔌 Socket.IO: RECEIVED BROADCAST-MESSAGE EVENT');
    console.log('🔌 Socket.IO: Data:', JSON.stringify(data, null, 2));
    console.log('🔌 Socket.IO: From socket:', socket.id);
    
    const { conversationId, message } = data;
    
    if (!conversationId || !message) {
      console.error('🔌 Socket.IO: Invalid broadcast-message data:', data);
      if (callback) {
        callback({ success: false, error: 'Invalid data' });
      }
      return;
    }
    
    console.log(`🔌 Socket.IO: Broadcasting message to conversation ${conversationId}`);
    console.log(`🔌 Socket.IO: Message ID: ${message.id}`);
    console.log(`🔌 Socket.IO: Message content: ${message.content}`);
    
    // Broadcast to all users in the conversation
    io.to(`conversation-${conversationId}`).emit('new-message', {
      conversationId,
      message
    });
    
    console.log(`🔌 Socket.IO: Message broadcasted successfully to conversation ${conversationId}`);
    
    if (callback) {
      callback({ success: true, timestamp: Date.now() });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { conversationId } = data;
    const userId = socketUsers.get(socket.id);
    
    if (!userId) {
      return;
    }

    // Broadcast typing to other users in conversation
    socket.to(`conversation-${conversationId}`).emit('user-typing', {
      conversationId,
      userId,
      isTyping: true
    });
  });

  socket.on('stop-typing', (data) => {
    const { conversationId } = data;
    const userId = socketUsers.get(socket.id);
    
    if (!userId) {
      return;
    }

    // Broadcast stop typing to other users in conversation
    socket.to(`conversation-${conversationId}`).emit('user-typing', {
      conversationId,
      userId,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = socketUsers.get(socket.id);
    console.log(`🔌 Socket.IO: User ${userId} disconnected (socket ${socket.id})`);
    
    // Clean up user connections
    if (userId) {
      userConnections.delete(userId);
    }
    socketUsers.delete(socket.id);
    
    // Clean up room memberships
    for (const [conversationId, members] of roomMembers.entries()) {
      members.delete(socket.id);
      if (members.size === 0) {
        roomMembers.delete(conversationId);
      }
    }
  });
});

// Function to broadcast messages from the Next.js app
function broadcastMessage(conversationId, message) {
  console.log(`🔌 Socket.IO: Broadcasting message to conversation ${conversationId}`);
  io.to(`conversation-${conversationId}`).emit('message-received', {
    conversationId,
    message
  });
}

// Export for use by Next.js app
module.exports = {
  broadcastMessage,
  io
};

// Start the server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🔌 Socket.IO server running on http://0.0.0.0:${port}`);
  console.log(`🔌 Socket.IO server accessible at http://192.168.1.122:${port} or http://192.168.1.120:${port}`);
  console.log('🔌 Ready to handle real-time messaging');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Socket.IO server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Socket.IO server...');
  process.exit(0);
});
