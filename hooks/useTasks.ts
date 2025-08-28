import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Task } from '@prisma/client'

export function useTasks() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user ID from session
  const userId = (session?.user as any)?.id || 'demo-user-1'

  // Load tasks from API
  const loadTasks = useCallback(async (filters?: {
    subjectId?: string
    status?: string
    priority?: string
  }) => {
    if (!userId) {
      console.log('🔍 useTasks: No userId, skipping load')
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
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters?.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority)
      }

      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`
      console.log('🔍 useTasks: Fetching from URL:', url)
      console.log('🔍 useTasks: UserId:', userId)
      
      const response = await fetch(url)
      console.log('🔍 useTasks: Response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      console.log('🔍 useTasks: Received data:', {
        dataLength: data?.length || 0,
        dataSample: data?.slice(0, 2) || [],
        dataType: typeof data,
        isArray: Array.isArray(data),
        rawData: data
      })
      
      if (Array.isArray(data)) {
        console.log('🔍 useTasks: Setting tasks array with length:', data.length)
        setTasks(data)
      } else {
        console.log('🔍 useTasks: Data is not an array, setting empty array')
        setTasks([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('🔍 useTasks: Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create a new task
  const createTask = useCallback(async (taskData: {
    title: string
    description?: string
    subjectId?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'in_progress' | 'completed'
    dueDate?: string
    progress?: number
    timeSpent?: number
    category?: string
    estimatedTime?: number
  }) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      const newTask = await response.json()
      setTasks(prev => [newTask, ...prev])
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing task
  const updateTask = useCallback(async (taskId: string, updates: {
    title?: string
    description?: string
    subjectId?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'in_progress' | 'completed'
    dueDate?: string
    progress?: number
    timeSpent?: number
  }) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ))
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      
      setTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Toggle task completion
  const toggleTaskComplete = useCallback(async (taskId: string) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const currentTask = tasks.find(task => task.id === taskId)
      if (!currentTask) return

      const newStatus = currentTask.status === 'completed' ? 'pending' : 'completed'
      const newProgress = newStatus === 'completed' ? 100 : 0

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          progress: newProgress,
          dueDate: currentTask.dueDate, // Preserve the due date
          title: currentTask.title, // Preserve other fields
          description: currentTask.description,
          subjectId: currentTask.subjectId,
          priority: currentTask.priority
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ))
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task completion'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, tasks])

  // Update task progress
  const updateTaskProgress = useCallback(async (taskId: string, progress: number) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task progress')
      }
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ))
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task progress'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Add time to task
  const addTimeToTask = useCallback(async (taskId: string, minutes: number) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const currentTask = tasks.find(task => task.id === taskId)
      if (!currentTask) return

      const newTimeSpent = (currentTask.timeSpent || 0) + minutes
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeSpent: newTimeSpent }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task time')
      }
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ))
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add time to task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, tasks])

  // Search tasks
  const searchTasks = useCallback(async (query: string) => {
    if (!userId || !query.trim()) return []

    try {
      setError(null)
      // For now, filter locally since we have all tasks loaded
      return tasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search tasks'
      setError(errorMessage)
      return []
    }
  }, [userId, tasks])

  // Get tasks by subject
  const getTasksBySubject = useCallback(async (subjectId: string) => {
    if (!userId) return []

    try {
      setError(null)
      return tasks.filter(task => task.subjectId === subjectId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tasks by subject'
      setError(errorMessage)
      return []
    }
  }, [userId, tasks])

  // Get overdue tasks
  const getOverdueTasks = useCallback(async () => {
    if (!userId) return []

    try {
      setError(null)
      const now = new Date()
      return tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'completed'
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get overdue tasks'
      setError(errorMessage)
      return []
    }
  }, [userId, tasks])

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    loadTasks()
  }, [loadTasks])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Load tasks on mount and when user changes
  useEffect(() => {
    loadTasks()
  }, [loadTasks, userId])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    updateTaskProgress,
    addTimeToTask,
    searchTasks,
    getTasksBySubject,
    getOverdueTasks,
    refreshTasks
  }
}
