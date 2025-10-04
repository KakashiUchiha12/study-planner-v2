import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "start" or "stop"' },
        { status: 400 }
      );
    }

    // Trigger typing event via Pusher
    const eventName = action === 'start' ? 'user-typing' : 'user-stopped-typing';
    const eventData = action === 'start' 
      ? {
          userId: session.user.id,
          userName: session.user.name,
          userImage: session.user.image,
        }
      : {
          userId: session.user.id,
        };

    await pusherServer.trigger(`typing-${id}`, eventName, eventData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Typing event error:', error);
    return NextResponse.json(
      { error: 'Failed to send typing event' },
      { status: 500 }
    );
  }
}
