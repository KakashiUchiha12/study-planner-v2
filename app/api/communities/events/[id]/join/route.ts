import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// POST /api/communities/events/[id]/join - Join an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    
    console.log('🔍 POST /api/communities/events/[id]/join - User joining event:', eventId);

    // Check if user is already attending
    const existingAttendance = await communityService.getEventAttendance(eventId, session.user.id);
    if (existingAttendance) {
      return NextResponse.json({ error: 'You are already attending this event' }, { status: 400 });
    }

    // Join the event
    const attendance = await communityService.joinEvent(eventId, session.user.id);

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    console.error('Error joining event:', error);
    return NextResponse.json(
      { error: 'Failed to join event' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/events/[id]/join - Leave an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    
    console.log('🔍 DELETE /api/communities/events/[id]/join - User leaving event:', eventId);

    // Leave the event
    await communityService.leaveEvent(eventId, session.user.id);

    return NextResponse.json({ message: 'Successfully left event' }, { status: 200 });
  } catch (error) {
    console.error('Error leaving event:', error);
    return NextResponse.json(
      { error: 'Failed to leave event' },
      { status: 500 }
    );
  }
}
