import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calendarEventService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const eventId = (await params).id

    // Check if the event exists and belongs to the user
    const existingEvent = await calendarEventService.getCalendarEventById(eventId)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Toggle the completion status
    const updatedEvent = await calendarEventService.toggleEventCompletion(eventId)

    return NextResponse.json({ 
      success: true, 
      event: updatedEvent,
      message: `Event ${updatedEvent.completed ? 'marked as completed' : 'marked as incomplete'}` 
    })
  } catch (error) {
    console.error('Error toggling calendar event completion:', error)
    return NextResponse.json(
      { error: 'Failed to toggle event completion' },
      { status: 500 }
    )
  }
}
