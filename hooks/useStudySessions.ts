import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { StudySession } from '@prisma/client'
import { notifyDataUpdate } from '@/lib/data-sync'

export function useStudySessions() {
  const { data: session } = useSession()
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user ID from session
  const userId = (session?.user as any)?.id

  // Load study sessions from API
  const loadStudySessions = useCallback(async (filters?: {
    subjectId?: string
    sessionType?: string
    startDate?: string
    endDate?: string
  }) => {
    if (!userId) {
      console.log('🔍 useStudySessions: No userId, skipping load')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters?.subjectId && filters.subjectId !== 'all') {
        params.append('subjectId', filters.subjectId)
      }
      if (filters?.sessionType && filters.sessionType !== 'all') {
        params.append('sessionType', filters.sessionType)
      }
      if (filters?.startDate && filters?.endDate) {
        params.append('startDate', filters.startDate)
        params.append('endDate', filters.endDate)
      }

      const url = `/api/study-sessions${params.toString() ? `?${params.toString()}` : ''}`
      console.log('🔍 useStudySessions: Fetching from URL:', url)
      console.log('🔍 useStudySessions: UserId:', userId)
      
      const response = await fetch(url)
      console.log('🔍 useStudySessions: Response status:', response.status)
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (!response.ok) {
        throw new Error('Failed to fetch study sessions')
      }
      
      const data = await response.json()
      console.log('🔍 useStudySessions: Received data:', {
        dataLength: data?.length || 0,
        dataSample: data?.slice(0, 2) || []
      })
      setStudySessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study sessions')
      console.error('🔍 useStudySessions: Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create a new study session
  const createStudySession = useCallback(async (sessionData: Partial<Omit<StudySession, 'id' | 'userId' | 'createdAt'>>) => {
    if (!userId) return

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to create study session')
      }

      const newSession = await response.json()
      setStudySessions(prev => [...prev, newSession])
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      return newSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create study session'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing study session
  const updateStudySession = useCallback(async (sessionId: string, updates: Partial<StudySession>) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to update study session')
      }

      const updatedSession = await response.json()
      setStudySessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      return updatedSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update study session'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a study session
  const deleteStudySession = useCallback(async (sessionId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to delete study session')
      }

      setStudySessions(prev => prev.filter(session => session.id !== sessionId))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete study session'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Get study sessions by date range
  const getStudySessionsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!userId) return []

    try {
      setError(null)
      return studySessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return sessionDate >= start && sessionDate <= end
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get study sessions by date range'
      setError(errorMessage)
      return []
    }
  }, [userId, studySessions])

  // Get study sessions by subject
  const getStudySessionsBySubject = useCallback(async (subjectId: string) => {
    if (!userId) return []

    try {
      setError(null)
      return studySessions.filter(session => session.subjectId === subjectId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get study sessions by subject'
      setError(errorMessage)
      return []
    }
  }, [userId, studySessions])

  // Get study sessions by week
  const getStudySessionsByWeek = useCallback(async (weekStart: string) => {
    if (!userId) return []

    try {
      setError(null)
      const startOfWeek = new Date(weekStart)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      return studySessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= startOfWeek && sessionDate <= endOfWeek
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get study sessions by week'
      setError(errorMessage)
      return []
    }
  }, [userId, studySessions])

  // Get study sessions by month
  const getStudySessionsByMonth = useCallback(async (year: number, month: number) => {
    if (!userId) return []

    try {
      setError(null)
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0)

      return studySessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= startOfMonth && sessionDate <= endOfMonth
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get study sessions by month'
      setError(errorMessage)
      return []
    }
  }, [userId, studySessions])

  // Search study sessions
  const searchStudySessions = useCallback(async (query: string) => {
    if (!userId || !query.trim()) return []

    try {
      setError(null)
      // For now, filter locally since we have all sessions loaded
      return studySessions.filter(session => {
        const subjectName = session.subjectId || 'Unknown Subject'
        const notes = session.notes || ''
        const topicsCovered = session.topicsCovered ? JSON.parse(session.topicsCovered) : []
        const materialsUsed = session.materialsUsed ? JSON.parse(session.materialsUsed) : []

        return (
          subjectName.toLowerCase().includes(query.toLowerCase()) ||
          notes.toLowerCase().includes(query.toLowerCase()) ||
          topicsCovered.some((topic: string) => topic.toLowerCase().includes(query.toLowerCase())) ||
          materialsUsed.some((material: string) => material.toLowerCase().includes(query.toLowerCase()))
        )
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search study sessions'
      setError(errorMessage)
      return []
    }
  }, [userId, studySessions])

  // Get study statistics
  const getStudyStatistics = useCallback(async () => {
    if (!userId) return null

    try {
      setError(null)
      const totalTime = studySessions.reduce((total, session) => total + session.durationMinutes, 0)
      const averageSessionLength = studySessions.length > 0 ? totalTime / studySessions.length : 0
      const totalSessions = studySessions.length
      const averageEfficiency = studySessions
        .filter(session => session.efficiency)
        .reduce((total, session) => total + (session.efficiency || 0), 0) / 
        studySessions.filter(session => session.efficiency).length || 0

      return {
        totalTime,
        averageSessionLength,
        totalSessions,
        averageEfficiency
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get study statistics'
      setError(errorMessage)
      return null
    }
  }, [userId, studySessions])

  // Refresh study sessions
  const refreshStudySessions = useCallback(() => {
    loadStudySessions()
  }, [loadStudySessions])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Load study sessions on mount and when user changes
  useEffect(() => {
    console.log('🔍 useStudySessions useEffect: Called with userId:', userId)
    if (userId) {
      console.log('🔍 useStudySessions useEffect: Loading sessions for userId:', userId)
      loadStudySessions()
    } else {
      console.log('🔍 useStudySessions useEffect: No userId, not loading sessions')
    }
  }, [userId, loadStudySessions]) // Add loadStudySessions to dependencies

  return {
    studySessions,
    loading,
    error,
    createStudySession,
    updateStudySession,
    deleteStudySession,
    getStudySessionsByDateRange,
    getStudySessionsBySubject,
    getStudySessionsByWeek,
    getStudySessionsByMonth,
    searchStudySessions,
    getStudyStatistics,
    refreshStudySessions
  }
}
