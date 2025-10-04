import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// PUT /api/communities/events/[id]/pin - Pin/Unpin an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { isPinned } = await request.json();
    
    console.log('🔍 PUT /api/communities/events/[id]/pin - Pinning event:', eventId, isPinned);

    // Check if user is the creator of the event or has admin rights
    const event = await communityService.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // For now, only allow event creators to pin/unpin
    // TODO: Add community admin/moderator permissions
    if (event.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only pin/unpin events you created' },
        { status: 403 }
      );
    }

    const updatedEvent = await communityService.pinEvent(eventId, isPinned);

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('Error pinning/unpinning event:', error);
    return NextResponse.json(
      { error: 'Failed to pin/unpin event' },
      { status: 500 }
    );
  }
}
