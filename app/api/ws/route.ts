import { NextRequest } from 'next/server';
const { wsManager } = require('@/lib/websocket-server.js');

// WebSocket API route
export async function GET(request: NextRequest) {
  return new Response('WebSocket endpoint - use ws:// protocol', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

// Export the WebSocket manager for use in other parts of the app
export { wsManager };
