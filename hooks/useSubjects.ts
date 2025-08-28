import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Subject } from '@prisma/client'
import { notifyDataUpdate } from '@/lib/data-sync'
import { useRouter } from 'next/navigation'

export function useSubjects() {
  const { data: session, status } = useSession()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Get user ID from session
  const userId = (session?.user as any)?.id

  // Load subjects from API
  const loadSubjects = useCallback(async () => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subjects')
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status}`)
      }
      
      const data = await response.json()
      setSubjects(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subjects'
      setError(errorMessage)
      console.error('Failed to load subjects:', err)
      
      // Handle redirect on 401 error
      if (errorMessage === 'Authentication required. Please log in.') {
        // signOut({ callbackUrl: '/auth/login' }) // This line is removed as per the new_code
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, router])

  // Create a new subject
  const createSubject = useCallback(async (subjectData: Omit<Subject, 'id' | 'userId' | 'order' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to create subject')
      }

      const newSubject = await response.json()
      setSubjects(prev => [...prev, newSubject])
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return newSubject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subject'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing subject
  const updateSubject = useCallback(async (subjectId: string, updates: Partial<Subject>) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
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
        throw new Error('Failed to update subject')
      }

      const updatedSubject = await response.json()
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId ? updatedSubject : subject
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return updatedSubject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subject'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a subject
  const deleteSubject = useCallback(async (subjectId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to delete subject')
      }

      setSubjects(prev => prev.filter(subject => subject.id !== subjectId))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subject'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Search subjects
  const searchSubjects = useCallback(async (query: string) => {
    if (!query.trim()) return []
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      // For now, filter locally since we have all subjects loaded
      return subjects.filter(subject => 
        subject.name.toLowerCase().includes(query.toLowerCase())
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search subjects'
      setError(errorMessage)
      return []
    }
  }, [userId, subjects])

  // Get subjects with task counts
  const getSubjectsWithTaskCounts = useCallback(async () => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      // For now, return subjects as-is since we don't have task counts in the API yet
      return subjects
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get subjects with task counts'
      setError(errorMessage)
      return []
    }
  }, [userId, subjects])

  // Load subjects on mount and when userId changes
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session
      return
    }
    
    if (userId) {
      loadSubjects()
    } else {
      // If no user ID, clear subjects and set loading to false
      setSubjects([])
      setLoading(false)
    }
  }, [userId, status]) // Remove loadSubjects from dependencies to prevent infinite loops

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    searchSubjects,
    getSubjectsWithTaskCounts,
    refreshSubjects: loadSubjects
  }
}
