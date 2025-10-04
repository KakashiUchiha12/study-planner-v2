const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize Socket.IO broadcaster
  console.log('🔌 Server: Initializing Socket.IO broadcaster...');
  try {
    const { getConnectionStats } = require('./lib/socketio-broadcaster.js');
    console.log('🔌 Server: Socket.IO broadcaster loaded');
    console.log('🔌 Server: Broadcaster stats:', getConnectionStats());
  } catch (error) {
    console.error('🔌 Server: Error loading Socket.IO broadcaster:', error);
  }

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Add WebSocket health check endpoint (for separate server on port 3001)
      if (parsedUrl.pathname === '/api/ws/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          message: 'WebSocket server running on port 3001',
          status: 'separate'
        }));
        return;
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket server runs separately on port 3001
  console.log('🔌 WebSocket server runs separately on port 3001');

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('🔌 Next.js server ready - WebSocket server runs on port 3001');
  });
});
