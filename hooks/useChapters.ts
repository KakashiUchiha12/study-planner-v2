import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Chapter, CreateChapterData, UpdateChapterData } from '@/lib/database'
import { notifyDataUpdate } from '@/lib/data-sync'
import { useRouter } from 'next/navigation'

export function useChapters(subjectId?: string) {
  const { data: session, status } = useSession()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Get user ID from session
  const userId = (session?.user as any)?.id

  // Load chapters from API
  const loadChapters = useCallback(async () => {
    if (!userId || !subjectId) {
      throw new Error('User not authenticated or subject ID not provided')
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/chapters?subjectId=${subjectId}`)
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.status}`)
      }
      
      const data = await response.json()
      setChapters(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapters'
      setError(errorMessage)
      console.error('Failed to load chapters:', err)
      
      // Handle redirect on 401 error
      if (errorMessage === 'Authentication required. Please log in.') {
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, subjectId, router])

  // Create a new chapter
  const createChapter = useCallback(async (chapterData: CreateChapterData) => {
    if (!userId) return

    try {
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chapterData),
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to create chapter')
      }

      const newChapter = await response.json()
      setChapters(prev => [...prev, newChapter])
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return newChapter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chapter'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing chapter
  const updateChapter = useCallback(async (chapterId: string, updates: UpdateChapterData) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
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
        throw new Error('Failed to update chapter')
      }

      const updatedChapter = await response.json()
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? updatedChapter : chapter
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return updatedChapter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a chapter
  const deleteChapter = useCallback(async (chapterId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to delete chapter')
      }

      setChapters(prev => prev.filter(chapter => chapter.id !== chapterId))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chapter'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Toggle chapter completion
  const toggleChapterCompletion = useCallback(async (chapterId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/chapters/${chapterId}/toggle`, {
        method: 'PUT',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to toggle chapter completion')
      }

      const updatedChapter = await response.json()
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? updatedChapter : chapter
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return updatedChapter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle chapter completion'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Reorder chapters
  const reorderChapters = useCallback(async (chapterOrders: { id: string; order: number }[]) => {
    if (!userId || !subjectId) return

    try {
      // Update local state immediately for better UX
      const updatedChapters = chapters.map(chapter => {
        const newOrder = chapterOrders.find(co => co.id === chapter.id)
        return newOrder ? { ...chapter, order: newOrder.order } : chapter
      }).sort((a, b) => a.order - b.order)
      
      setChapters(updatedChapters)

      // Send update to server
      const updates = chapterOrders.map(({ id, order }) =>
        updateChapter(id, { order })
      )

      await Promise.all(updates)
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder chapters'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, subjectId, chapters, updateChapter])

  // Load chapters on mount and when subjectId changes
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session
      return
    }
    
    if (userId && subjectId) {
      loadChapters()
    } else {
      // If no user ID or subject ID, clear chapters and set loading to false
      setChapters([])
      setLoading(false)
    }
  }, [userId, subjectId, status]) // Remove loadChapters from dependencies to prevent infinite loops

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    chapters,
    loading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    toggleChapterCompletion,
    reorderChapters,
    refreshChapters: loadChapters
  }
}
