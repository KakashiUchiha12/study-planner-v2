import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CalendarEvent } from '@/types/events'
import { useNotifications } from './useNotifications'
import toast from 'react-hot-toast'

export function useCalendarEvents() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { scheduleNotification, cancelNotification } = useNotifications()

  const userId = (session?.user as any)?.id

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/calendar-events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
      setError(errorMessage)
      console.error('Error fetching calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load events on mount and when userId changes
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!userId) {
      toast.error('Please log in to create events')
      return null
    }

    try {
      setError(null)
      
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      const data = await response.json()
      const newEvent = data.event

      // Update local state
      setEvents(prev => [...prev, newEvent])

      // Schedule notification if enabled
      if (newEvent.notificationEnabled) {
        scheduleNotification(newEvent)
      }

      toast.success('Event created successfully!')
      return newEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error creating calendar event:', err)
      return null
    }
  }, [userId, scheduleNotification])

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/calendar-events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      const data = await response.json()
      const updatedEvent = data.event

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ))

      // Handle notification changes
      if (updates.notificationEnabled !== undefined) {
        if (updates.notificationEnabled) {
          scheduleNotification(updatedEvent)
        } else {
          cancelNotification(id)
        }
      }

      toast.success('Event updated successfully!')
      return updatedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating calendar event:', err)
      return null
    }
  }, [scheduleNotification, cancelNotification])

  const deleteEvent = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/calendar-events/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete event')
      }

      // Cancel any scheduled notifications
      cancelNotification(id)

      // Update local state
      setEvents(prev => prev.filter(event => event.id !== id))

      toast.success('Event deleted successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error deleting calendar event:', err)
    }
  }, [cancelNotification])

  const toggleEventCompletion = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/calendar-events/${id}/toggle`, {
        method: 'PUT'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle event completion')
      }

      const data = await response.json()
      const updatedEvent = data.event

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ))

      toast.success(data.message)
      return updatedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle event completion'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error toggling event completion:', err)
      return null
    }
  }, [])

  const refreshEvents = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  // Utility functions for filtering events
  const getEventsByDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    })
  }, [events])

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate >= now && eventDate <= futureDate
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events])

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventCompletion,
    refreshEvents,
    getEventsByDate,
    getUpcomingEvents
  }
}
