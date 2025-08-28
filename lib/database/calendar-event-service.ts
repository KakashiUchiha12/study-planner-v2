import { dbService } from './database-service'
import type { CalendarEvent } from './index'

const prisma = dbService.getPrisma()

export interface CreateCalendarEventData {
  title: string
  start: Date
  end: Date
  type: 'study' | 'assignment' | 'exam' | 'break' | 'personal'
  description?: string
  location?: string
  priority: 'low' | 'medium' | 'high'
  completed?: boolean
  notificationEnabled?: boolean
  notificationTime?: number
  color?: string
  recurringType?: 'daily' | 'weekly' | 'monthly'
  recurringInterval?: number
  recurringEndDate?: Date
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {
  // All fields are optional for updates - extends from CreateCalendarEventData
  // This interface allows partial updates of calendar events
  id?: string // Allow updating the event ID if needed
}

export class CalendarEventService {
  /**
   * Get all calendar events for a user
   */
  async getUserCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    try {
      return await prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { start: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching user calendar events:', error)
      throw new Error('Failed to fetch calendar events')
    }
  }

  /**
   * Get calendar event by ID
   */
  async getCalendarEventById(eventId: string): Promise<CalendarEvent | null> {
    try {
      return await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      })
    } catch (error) {
      console.error('Error fetching calendar event:', error)
      throw new Error('Failed to fetch calendar event')
    }
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(userId: string, data: CreateCalendarEventData): Promise<CalendarEvent> {
    try {
      return await prisma.calendarEvent.create({
        data: {
          ...data,
          userId,
          completed: data.completed ?? false,
          notificationEnabled: data.notificationEnabled ?? false,
          notificationTime: data.notificationTime ?? 15
        }
      })
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error('Failed to create calendar event')
    }
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(eventId: string, data: UpdateCalendarEventData): Promise<CalendarEvent> {
    try {
      return await prisma.calendarEvent.update({
        where: { id: eventId },
        data
      })
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error('Failed to update calendar event')
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      await prisma.calendarEvent.delete({
        where: { id: eventId }
      })
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw new Error('Failed to delete calendar event')
    }
  }

  /**
   * Get events for a specific date range
   */
  async getEventsInRange(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      return await prisma.calendarEvent.findMany({
        where: {
          userId,
          start: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { start: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching events in range:', error)
      throw new Error('Failed to fetch events in range')
    }
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(userId: string, limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date()
      return await prisma.calendarEvent.findMany({
        where: {
          userId,
          start: {
            gte: now
          },
          completed: false
        },
        orderBy: { start: 'asc' },
        take: limit
      })
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
      throw new Error('Failed to fetch upcoming events')
    }
  }

  /**
   * Toggle event completion status
   */
  async toggleEventCompletion(eventId: string): Promise<CalendarEvent> {
    try {
      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      })
      
      if (!event) {
        throw new Error('Event not found')
      }

      return await prisma.calendarEvent.update({
        where: { id: eventId },
        data: { completed: !event.completed }
      })
    } catch (error) {
      console.error('Error toggling event completion:', error)
      throw new Error('Failed to toggle event completion')
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(userId: string, type: string): Promise<CalendarEvent[]> {
    try {
      return await prisma.calendarEvent.findMany({
        where: {
          userId,
          type
        },
        orderBy: { start: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching events by type:', error)
      throw new Error('Failed to fetch events by type')
    }
  }
}

export const calendarEventService = new CalendarEventService()
