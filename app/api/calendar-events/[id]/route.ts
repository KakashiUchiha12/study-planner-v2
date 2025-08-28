import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calendarEventService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const eventId = (await params).id
    const event = await calendarEventService.getCalendarEventById(eventId)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if the event belongs to the authenticated user
    if (event.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    )
  }
}

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
    const updateData = await request.json()

    // Check if the event exists and belongs to the user
    const existingEvent = await calendarEventService.getCalendarEventById(eventId)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the event
    const updatedEvent = await calendarEventService.updateCalendarEvent(eventId, {
      ...updateData,
      start: updateData.start ? new Date(updateData.start) : undefined,
      end: updateData.end ? new Date(updateData.end) : undefined,
      recurringEndDate: updateData.recurringEndDate ? new Date(updateData.recurringEndDate) : undefined
    })

    return NextResponse.json({ 
      success: true, 
      event: updatedEvent,
      message: 'Calendar event updated successfully' 
    })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete the event
    await calendarEventService.deleteCalendarEvent(eventId)

    return NextResponse.json({ 
      success: true,
      message: 'Calendar event deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}
