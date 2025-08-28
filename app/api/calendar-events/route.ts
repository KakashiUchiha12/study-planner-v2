import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calendarEventService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    let events

    if (startDate && endDate) {
      // Get events in specific date range
      events = await calendarEventService.getEventsInRange(
        userId,
        new Date(startDate),
        new Date(endDate)
      )
    } else if (type) {
      // Get events by type
      events = await calendarEventService.getEventsByType(userId, type)
    } else if (limit) {
      // Get upcoming events with limit
      events = await calendarEventService.getUpcomingEvents(userId, parseInt(limit))
    } else {
      // Get all events
      events = await calendarEventService.getUserCalendarEvents(userId)
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const eventData = await request.json()

    // Validate required fields
    if (!eventData.title || !eventData.start || !eventData.end || !eventData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start, end, type' },
        { status: 400 }
      )
    }

    // Create the calendar event
    const newEvent = await calendarEventService.createCalendarEvent(userId, {
      ...eventData,
      start: new Date(eventData.start),
      end: new Date(eventData.end),
      recurringEndDate: eventData.recurringEndDate ? new Date(eventData.recurringEndDate) : undefined
    })

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      message: 'Calendar event created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
