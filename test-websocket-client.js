// Simple Node.js WebSocket client to test server connectivity
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket server with Node.js client...');

const ws = new WebSocket('ws://localhost:3000/api/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Send a test message
  ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
  console.log('📤 Sent ping message');
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('close', function close(code, reason) {
  console.log(`❌ Connection closed - Code: ${code}, Reason: ${reason}`);
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

// Keep the connection alive for 10 seconds
setTimeout(() => {
  console.log('🔌 Closing connection...');
  ws.close(1000, 'Test completed');
  process.exit(0);
}, 10000);
