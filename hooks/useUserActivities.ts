import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'

interface UserActivity {
  id: string
  userId: string
  type: string
  title: string
  description?: string
  metadata?: string
  timestamp: Date
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

interface UseUserActivitiesReturn {
  activities: UserActivity[]
  loading: boolean
  error: string | null
  fetchRecentActivities: () => Promise<void>
  fetchAllActivities: (page?: number, pageSize?: number) => Promise<{
    activities: UserActivity[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
  createActivity: (data: {
    type: string
    title: string
    description?: string
    metadata?: any
  }) => Promise<void>
  markAsRead: (activityId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useUserActivities(): UseUserActivitiesReturn {
  const { data: session, status } = useSession()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentActivities = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/activities?limit=10', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setActivities(data)
    } catch (err) {
      console.error('Error fetching recent activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }, [session?.user, status])

  const fetchAllActivities = useCallback(async (page: number = 1, pageSize: number = 20) => {
    if (status !== 'authenticated' || !session?.user) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/activities?page=${page}&pageSize=${pageSize}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error fetching all activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user, status])

  const createActivity = useCallback(async (data: {
    type: string
    title: string
    description?: string
    metadata?: any
  }) => {
    if (status !== 'authenticated' || !session?.user) {
      throw new Error('User not authenticated')
    }

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Refresh activities after creating new one
      await fetchRecentActivities()
    } catch (err) {
      console.error('Error creating activity:', err)
      throw err
    }
  }, [session?.user, status, fetchRecentActivities])

  const markAsRead = useCallback(async (activityId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update local state
      setActivities(prev => prev.map(activity => 
        activity.id === activityId ? { ...activity, isRead: true } : activity
      ))
    } catch (err) {
      console.error('Error marking activity as read:', err)
      throw err
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/activities/read-all', {
        method: 'PUT',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update local state
      setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })))
    } catch (err) {
      console.error('Error marking all activities as read:', err)
      throw err
    }
  }, [])

  // Fetch recent activities on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchRecentActivities()
    }
  }, [status, session?.user, fetchRecentActivities])

  return {
    activities,
    loading,
    error,
    fetchRecentActivities,
    fetchAllActivities,
    createActivity,
    markAsRead,
    markAllAsRead
  }
}
