/**
 * Offline-aware Subjects Hook
 * Works with your existing SQLite database and adds offline capabilities
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'
import { useOfflineData } from './useOfflineData'

export function useOfflineSubjects() {
  const { data: session } = useSession()
  const { isOnline, storeOfflineData, getOfflineData, queueChange } = useOfflineData()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = (session?.user as any)?.id

  // Load subjects from server or offline storage
  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isOnline) {
        // Try to fetch from server
        const response = await fetch('/api/subjects')
        
        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
          // Store for offline use
          storeOfflineData('subjects', data)
        } else {
          throw new Error('Failed to fetch subjects')
        }
      } else {
        // Use offline data
        const offlineData = getOfflineData('subjects')
        if (offlineData) {
          setSubjects(offlineData)
        } else {
          setSubjects([])
        }
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
      setError(error instanceof Error ? error.message : 'Failed to load subjects')
      
      // Fallback to offline data
      const offlineData = getOfflineData('subjects')
      if (offlineData) {
        setSubjects(offlineData)
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [isOnline, storeOfflineData, getOfflineData])

  // Create subject
  const createSubject = useCallback(async (subjectData: any) => {
    try {
      const newSubject = {
        ...subjectData,
        id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to local state immediately
      setSubjects(prev => [...prev, newSubject])

      if (isOnline) {
        // Try to sync with server
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubject)
        })

        if (!response.ok) {
          throw new Error('Failed to create subject')
        }
      } else {
        // Queue for later sync
        queueChange('/api/subjects', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify(newSubject))
      }

      // Update offline storage
      const updatedSubjects = [...subjects, newSubject]
      storeOfflineData('subjects', updatedSubjects)

      return newSubject
    } catch (error) {
      console.error('Failed to create subject:', error)
      // Remove from local state if failed
      setSubjects(prev => prev.filter(s => s.id !== subjectData.id))
      throw error
    }
  }, [isOnline, subjects, storeOfflineData, queueChange, userId])

  // Update subject
  const updateSubject = useCallback(async (id: string, updates: any) => {
    try {
      const updatedSubject = {
        ...updates,
        id,
        updatedAt: new Date()
      }

      // Update local state immediately
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updatedSubject } : s))

      if (isOnline) {
        // Try to sync with server
        const response = await fetch(`/api/subjects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSubject)
        })

        if (!response.ok) {
          throw new Error('Failed to update subject')
        }
      } else {
        // Queue for later sync
        queueChange(`/api/subjects/${id}`, 'PUT', { 'Content-Type': 'application/json' }, JSON.stringify(updatedSubject))
      }

      // Update offline storage
      const updatedSubjects = subjects.map(s => s.id === id ? { ...s, ...updatedSubject } : s)
      storeOfflineData('subjects', updatedSubjects)

      return updatedSubject
    } catch (error) {
      console.error('Failed to update subject:', error)
      // Revert local state if failed
      loadSubjects()
      throw error
    }
  }, [isOnline, subjects, storeOfflineData, queueChange, loadSubjects])

  // Delete subject
  const deleteSubject = useCallback(async (id: string) => {
    try {
      // Remove from local state immediately
      setSubjects(prev => prev.filter(s => s.id !== id))

      if (isOnline) {
        // Try to sync with server
        const response = await fetch(`/api/subjects/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete subject')
        }
      } else {
        // Queue for later sync
        queueChange(`/api/subjects/${id}`, 'DELETE', {}, null)
      }

      // Update offline storage
      const updatedSubjects = subjects.filter(s => s.id !== id)
      storeOfflineData('subjects', updatedSubjects)
    } catch (error) {
      console.error('Failed to delete subject:', error)
      // Revert local state if failed
      loadSubjects()
      throw error
    }
  }, [isOnline, subjects, storeOfflineData, queueChange, loadSubjects])

  // Refresh subjects
  const refreshSubjects = useCallback(async () => {
    await loadSubjects()
  }, [loadSubjects])

  // Load subjects on mount
  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    refreshSubjects,
    isOnline
  }
}
