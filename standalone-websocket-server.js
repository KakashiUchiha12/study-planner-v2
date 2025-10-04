// Standalone WebSocket server for testing
const { WebSocketServer } = require('ws');
const { createServer } = require('http');

const port = 3001; // Different port to avoid conflicts

console.log('🔌 Starting standalone WebSocket server...');

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/api/ws',
  perMessageDeflate: false,
  maxPayload: 1024 * 1024,
  verifyClient: false,
});

wss.on('connection', (ws, request) => {
  const connectionId = Math.random().toString(36).substring(2, 15);
  console.log('🔌 Standalone Server: New connection', {
    id: connectionId,
    origin: request.headers.origin,
    url: request.url
  });

  // Send welcome message after a delay
  setTimeout(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({
          type: 'connected',
          connectionId,
          timestamp: Date.now()
        }));
        console.log(`🔌 Standalone Server: Welcome sent to ${connectionId}`);
      } catch (error) {
        console.error(`🔌 Standalone Server: Error sending welcome:`, error);
      }
    } else {
      console.log(`🔌 Standalone Server: Connection ${connectionId} not ready, state: ${ws.readyState}`);
    }
  }, 100);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`🔌 Standalone Server: Message from ${connectionId}:`, message.type);
      
      // Echo back pong for ping
      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error(`🔌 Standalone Server: Error parsing message:`, error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log('🔌 Standalone Server: Connection closed', {
      id: connectionId,
      code,
      reason: reason.toString(),
      wasClean: code === 1000
    });
  });

  ws.on('error', (error) => {
    console.error('🔌 Standalone Server: WebSocket error', {
      id: connectionId,
      error: error.message,
      code: error.code,
      readyState: ws.readyState
    });
  });
});

// Start the server
server.listen(port, () => {
  console.log(`🔌 Standalone WebSocket server running on ws://localhost:${port}/api/ws`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('🔌 Standalone Server error:', err);
});
