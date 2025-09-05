import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
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
    console.log('📅 Creating calendar event for user:', userId)
    
    const eventData = await request.json()
    console.log('📅 Received event data:', eventData)
    console.log('📅 Event data type:', typeof eventData)
    console.log('📅 Start date type:', typeof eventData.start, 'value:', eventData.start)
    console.log('📅 End date type:', typeof eventData.end, 'value:', eventData.end)

    // Validate required fields
    console.log('📅 Validating required fields...')
    console.log('📅 Title:', eventData.title, 'Type:', typeof eventData.title)
    console.log('📅 Start:', eventData.start, 'Type:', typeof eventData.start)
    console.log('📅 End:', eventData.end, 'Type:', typeof eventData.end)
    console.log('📅 Type:', eventData.type, 'Type:', typeof eventData.type)
    
    if (!eventData.title || !eventData.start || !eventData.end || !eventData.type) {
      const missingFields = []
      if (!eventData.title) missingFields.push('title')
      if (!eventData.start) missingFields.push('start')
      if (!eventData.end) missingFields.push('end')
      if (!eventData.type) missingFields.push('type')
      
      console.log('📅 Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Create the calendar event
    console.log('📅 Calling calendar event service...')
    const eventDataForService = {
      ...eventData,
      start: new Date(eventData.start),
      end: new Date(eventData.end),
      recurringEndDate: eventData.recurringEndDate ? new Date(eventData.recurringEndDate) : undefined
    }
    console.log('📅 Event data for service:', eventDataForService)
    
    const newEvent = await calendarEventService.createCalendarEvent(userId, eventDataForService)

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      message: 'Calendar event created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { error: `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
