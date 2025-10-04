// Socket.IO broadcaster module - sends messages to the Socket.IO server
// This is used by the Next.js app to broadcast messages to the Socket.IO server

const { io } = require('socket.io-client');

// Create a client connection to the Socket.IO server for broadcasting
let broadcasterSocket = null;
let isInitialized = false;

function initializeBroadcaster() {
  if (broadcasterSocket && isInitialized) {
    console.log('🔌 Socket.IO Broadcaster: Already initialized, skipping...');
    return;
  }

  console.log('🔌 Socket.IO Broadcaster: Initializing broadcaster connection...');
  
  broadcasterSocket = io('http://localhost:3001', {
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: false, // Don't force new connections
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000
  });

  broadcasterSocket.on('connect', () => {
    console.log('🔌 Socket.IO Broadcaster: Connected to Socket.IO server');
    console.log('🔌 Socket.IO Broadcaster: Socket ID:', broadcasterSocket.id);
    console.log('🔌 Socket.IO Broadcaster: Connection URL:', broadcasterSocket.io.uri);
    console.log('🔌 Socket.IO Broadcaster: Transport:', broadcasterSocket.io.engine.transport.name);
    
    // Mark as initialized
    isInitialized = true;
    
    // Authenticate as a broadcaster
    console.log('🔌 Socket.IO Broadcaster: Authenticating as broadcaster...');
    broadcasterSocket.emit('authenticate', { userId: 'broadcaster' });
  });

  broadcasterSocket.on('connect_error', (error) => {
    console.error('🔌 Socket.IO Broadcaster: Connection error:', error);
    console.error('🔌 Socket.IO Broadcaster: Error details:', error.message);
    console.error('🔌 Socket.IO Broadcaster: Error type:', error.type);
    
    // Retry connection after 3 seconds
    setTimeout(() => {
      console.log('🔌 Socket.IO Broadcaster: Retrying connection...');
      broadcasterSocket.connect();
    }, 3000);
  });

  broadcasterSocket.on('authenticated', (data) => {
    console.log('🔌 Socket.IO Broadcaster: Authentication successful:', data);
    
    // Test the connection by sending a ping
    console.log('🔌 Socket.IO Broadcaster: Testing connection with ping...');
    broadcasterSocket.emit('ping', { timestamp: Date.now() }, (response) => {
      console.log('🔌 Socket.IO Broadcaster: Ping response:', response);
    });
  });

  broadcasterSocket.on('disconnect', (reason) => {
    console.log('🔌 Socket.IO Broadcaster: Disconnected:', reason);
    console.log('🔌 Socket.IO Broadcaster: Disconnect reason details:', reason);
    console.log('🔌 Socket.IO Broadcaster: Attempting to reconnect...');
    isInitialized = false;
  });
}

// Function to broadcast messages to a conversation
function broadcastMessage(conversationId, message) {
  console.log(`🔌 Socket.IO Broadcaster: Broadcasting message to conversation ${conversationId}`);
  console.log(`🔌 Socket.IO Broadcaster: Message:`, JSON.stringify(message, null, 2));
  
  try {
    // Initialize broadcaster if not already done
    if (!broadcasterSocket) {
      console.log('🔌 Socket.IO Broadcaster: Initializing broadcaster...');
      initializeBroadcaster();
    }

    // Always wait for connection to ensure we're connected
    const emitMessage = () => {
      console.log('🔌 Socket.IO Broadcaster: Sending message');
      console.log('🔌 Socket.IO Broadcaster: Emitting broadcast-message event');
      console.log('🔌 Socket.IO Broadcaster: Socket connected:', broadcasterSocket.connected);
      console.log('🔌 Socket.IO Broadcaster: Socket ID:', broadcasterSocket.id);
      console.log('🔌 Socket.IO Broadcaster: Socket transport:', broadcasterSocket.io.engine.transport.name);
      console.log('🔌 Socket.IO Broadcaster: About to emit broadcast-message with data:', { conversationId, message });
      console.log('🔌 Socket.IO Broadcaster: Socket object:', broadcasterSocket);
      console.log('🔌 Socket.IO Broadcaster: Socket connected status:', broadcasterSocket.connected);
      console.log('🔌 Socket.IO Broadcaster: Socket ID:', broadcasterSocket.id);
      broadcasterSocket.emit('broadcast-message', { conversationId, message }, (response) => {
        console.log('🔌 Socket.IO Broadcaster: Server response:', response);
      });
      console.log('🔌 Socket.IO Broadcaster: Event emitted, waiting for server response...');
    };

    if (!broadcasterSocket.connected) {
      console.log('🔌 Socket.IO Broadcaster: Waiting for connection...');
      broadcasterSocket.once('connect', () => {
        console.log('🔌 Socket.IO Broadcaster: Connected, sending message');
        emitMessage();
      });
      
      // Set a timeout to prevent waiting forever
      setTimeout(() => {
        if (!broadcasterSocket.connected) {
          console.error('🔌 Socket.IO Broadcaster: Connection timeout, message not sent');
        }
      }, 5000);
    } else {
      console.log('🔌 Socket.IO Broadcaster: Already connected, sending message immediately');
      emitMessage();
    }
    
    console.log('🔌 Socket.IO Broadcaster: Message sent successfully');
    
  } catch (error) {
    console.error(`🔌 Socket.IO Broadcaster: Error broadcasting message:`, error.message);
  }
}

// Function to broadcast to user channels
function broadcastToUser(userId, event, data) {
  console.log(`🔌 Socket.IO Broadcaster: Broadcasting to user ${userId}, event: ${event}`);
  console.log(`🔌 Socket.IO Broadcaster: Data:`, JSON.stringify(data, null, 2));
  
  try {
    // Initialize broadcaster if not already done
    if (!broadcasterSocket) {
      initializeBroadcaster();
    }

    // Wait for connection if not connected
    if (!broadcasterSocket.connected) {
      console.log('🔌 Socket.IO Broadcaster: Waiting for connection...');
      broadcasterSocket.once('connect', () => {
        console.log('🔌 Socket.IO Broadcaster: Connected, sending user message');
        broadcasterSocket.emit('broadcast-to-user', { userId, event, data });
      });
    } else {
      console.log('🔌 Socket.IO Broadcaster: Sending user message immediately');
      broadcasterSocket.emit('broadcast-to-user', { userId, event, data });
    }
    
    console.log('🔌 Socket.IO Broadcaster: User message sent successfully');
    
  } catch (error) {
    console.error(`🔌 Socket.IO Broadcaster: Error broadcasting to user:`, error.message);
  }
}

// Function to get connection stats (placeholder)
function getConnectionStats() {
  return {
    connected: broadcasterSocket ? broadcasterSocket.connected : false,
    totalConnections: 0,
    totalUsers: 0,
    totalChannels: 0,
    note: 'Stats not available from broadcaster module'
  };
}

// Initialize the broadcaster with a delay to ensure server is ready
console.log('🔌 Socket.IO Broadcaster: Module loaded, waiting for server to be ready...');
setTimeout(() => {
  console.log('🔌 Socket.IO Broadcaster: About to call initializeBroadcaster()');
  initializeBroadcaster();
  console.log('🔌 Socket.IO Broadcaster: initializeBroadcaster() called');
}, 2000); // Wait 2 seconds for server to be ready

module.exports = {
  broadcastMessage,
  broadcastToUser,
  getConnectionStats
};
