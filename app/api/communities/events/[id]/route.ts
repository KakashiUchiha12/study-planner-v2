import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// PUT /api/communities/events/[id] - Update an event
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
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const maxAttendees = formData.get('maxAttendees') as string;
    const type = formData.get('type') as string;
    const isOnline = formData.get('isOnline') === 'true';
    
    console.log('🔍 Event update data:', { title, description, date, time, location, maxAttendees, type, isOnline });

    // Validate required fields
    if (!title || !date || !time || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is the creator of the event
    const event = await communityService.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit events you created' },
        { status: 403 }
      );
    }

    const updatedEvent = await communityService.updateEvent(eventId, {
      title,
      description,
      startTime: new Date(`${date}T${time}`),
      location,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      type: type || 'meetup',
      isOnline,
    });

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/events/[id] - Delete an event
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

    // Check if user is the creator of the event
    const event = await communityService.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete events you created' },
        { status: 403 }
      );
    }

    await communityService.deleteEvent(eventId);

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
