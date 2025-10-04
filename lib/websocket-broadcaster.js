// WebSocket broadcaster module - uses HTTP to send messages to standalone WebSocket server
// This is used by the Next.js app to broadcast messages to the standalone WebSocket server

const http = require('http');

// Function to broadcast messages to the standalone WebSocket server via HTTP
function broadcastToChannel(channel, message) {
  console.log(`🔌 WebSocket Broadcaster: Broadcasting to ${channel}`);
  console.log(`🔌 WebSocket Broadcaster: Message:`, JSON.stringify(message, null, 2));
  
  try {
    // Create a broadcast message that the standalone server can process
    const broadcastMessage = {
      type: 'broadcast',
      channel: channel,
      message: message
    };
    
    const postData = JSON.stringify(broadcastMessage);
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/broadcast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000 // 5 second timeout
    };
    
    console.log('🔌 WebSocket Broadcaster: Sending HTTP broadcast to standalone server');
    
    const req = http.request(options, (res) => {
      console.log(`🔌 WebSocket Broadcaster: HTTP broadcast sent, status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log('🔌 WebSocket Broadcaster: Broadcast message sent successfully');
      } else {
        console.log('🔌 WebSocket Broadcaster: Broadcast may have failed, status:', res.statusCode);
      }
    });
    
    req.on('error', (error) => {
      console.error(`🔌 WebSocket Broadcaster: HTTP broadcast error:`, error.message);
      // This is expected if the standalone server is not running
    });
    
    req.on('timeout', () => {
      console.error('🔌 WebSocket Broadcaster: HTTP broadcast timeout');
      req.destroy();
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error(`🔌 WebSocket Broadcaster: Error broadcasting message:`, error.message);
  }
}

// Function to get connection stats (placeholder)
function getConnectionStats() {
  return {
    totalConnections: 0,
    totalUsers: 0,
    totalChannels: 0,
    note: 'Stats not available from broadcaster module'
  };
}

module.exports = {
  broadcastToChannel,
  getConnectionStats
};
