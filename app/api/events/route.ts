import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory event store
const eventStore = new Map<string, any[]>();

// Store events
export function storeEvent(channel: string, event: string, data: any) {
  const eventKey = `${channel}:${event}`;
  if (!eventStore.has(eventKey)) {
    eventStore.set(eventKey, []);
  }
  eventStore.get(eventKey)!.push({
    data,
    timestamp: Date.now()
  });
  
  // Keep only last 100 events per channel
  const events = eventStore.get(eventKey)!;
  if (events.length > 100) {
    events.splice(0, events.length - 100);
  }
  
  console.log(`🔔 EventStore: Stored event ${eventKey}, total events: ${events.length}`);
}

// Get events since timestamp
export function getEventsSince(channel: string, event: string, since: number) {
  const eventKey = `${channel}:${event}`;
  if (!eventStore.has(eventKey)) {
    return [];
  }
  
  const events = eventStore.get(eventKey)!;
  return events.filter(event => event.timestamp > since);
}

// Store event endpoint
export async function POST(request: NextRequest) {
  try {
    const { channel, event, data } = await request.json();
    
    if (!channel || !event) {
      return NextResponse.json({ error: 'Missing channel or event' }, { status: 400 });
    }
    
    storeEvent(channel, event, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing event:', error);
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
  }
}

// SSE endpoint for real-time events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const event = searchParams.get('event');
  const since = parseInt(searchParams.get('since') || '0');
  
  if (!channel || !event) {
    return NextResponse.json({ error: 'Missing channel or event' }, { status: 400 });
  }
  
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });
  
  const stream = new ReadableStream({
    start(controller) {
      console.log(`🔔 SSE: Starting stream for ${channel}:${event}`);
      
      // Send initial events
      const initialEvents = getEventsSince(channel, event, since);
      initialEvents.forEach(eventData => {
        controller.enqueue(`data: ${JSON.stringify(eventData.data)}\n\n`);
      });
      
      // Set up polling for new events
      const pollInterval = setInterval(() => {
        const newEvents = getEventsSince(channel, event, since);
        newEvents.forEach(eventData => {
          controller.enqueue(`data: ${JSON.stringify(eventData.data)}\n\n`);
        });
      }, 100);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        console.log(`🔔 SSE: Closing stream for ${channel}:${event}`);
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, { headers });
}
