import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'
import { Goal, GoalTask } from '@prisma/client'

interface UseGoalsReturn {
  goals: Goal[]
  loading: boolean
  error: string | null
  createGoal: (data: any) => Promise<void>
  updateGoal: (goalId: string, data: any) => Promise<void>
  deleteGoal: (goalId: string) => Promise<void>
  addGoalTask: (goalId: string, data: Omit<GoalTask, 'id' | 'goalId' | 'createdAt' | 'updatedAt'>) => Promise<GoalTask>
  updateGoalTask: (goalId: string, taskId: string, updates: Partial<GoalTask>) => Promise<GoalTask>
  toggleGoalTask: (taskId: string) => Promise<void>
  deleteGoalTask: (goalId: string, taskId: string) => Promise<void>
  reorderGoals: (goalIds: string[]) => Promise<void>
  reorderGoalTasks: (goalId: string, taskIds: string[]) => Promise<void>
  refreshGoals: () => Promise<void>
}

export const useGoals = () => {
  const { data: session, status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/goals')
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      const data = await response.json()
      setGoals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }, [(session?.user as any)?.id, status])

  const createGoal = useCallback(async (data: any) => {
    // Only create if user is authenticated
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newGoal = await response.json()
      setGoals(prev => [newGoal, ...prev])
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [(session?.user as any)?.id, status])

  const updateGoal = useCallback(async (goalId: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedGoal = await response.json()
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ))
    } catch (err) {
      console.error('Error updating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId))
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addGoalTask = useCallback(async (goalId: string, task: Omit<GoalTask, 'id' | 'goalId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const response = await fetch(`/api/goals/${goalId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      })

      if (!response.ok) {
        throw new Error('Failed to add task to goal')
      }

      const newTask = await response.json()
      
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { ...goal, tasks: [...(goal as any).tasks || [], newTask] }
            : goal
        )
      )

      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task to goal')
      throw err
    }
  }, [])

  const updateGoalTask = useCallback(async (goalId: string, taskId: string, updates: Partial<GoalTask>) => {
    try {
      setError(null)
      const response = await fetch(`/api/goals/${goalId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await response.json()
      
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goalId 
            ? { ...g, tasks: (g as any).tasks?.map((t: any) => t.id === taskId ? updatedTask : t) || [] }
            : g
        )
      )

      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const toggleGoalTask = useCallback(async (taskId: string) => {
    try {
      setError(null)
      // Find the goal that contains this task
      const goal = goals.find(g => (g as any).tasks?.some((t: any) => t.id === taskId))
      if (!goal) {
        throw new Error('Goal not found for task')
      }

      const response = await fetch(`/api/goals/${goal.id}/tasks/${taskId}/toggle`, {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle task')
      }

      const updatedTask = await response.json()
      
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goal.id 
            ? { ...g, tasks: (g as any).tasks?.map((t: any) => t.id === taskId ? updatedTask : t) || [] }
            : g
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task')
      throw err
    }
  }, [goals])

  const deleteGoalTask = useCallback(async (goalId: string, taskId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/goals/${goalId}/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goalId 
            ? { ...g, tasks: (g as any).tasks?.filter((t: any) => t.id !== taskId) || [] }
            : g
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [])

  const reorderGoals = useCallback(async (goalIds: string[]) => {
    try {
      setLoading(true)
      setError(null)
      
      // Optimistically update the UI
      const reorderedGoals = goalIds.map(id => goals.find(g => g.id === id)).filter(Boolean) as Goal[]
      setGoals(reorderedGoals)
      
      // Call the reorder API endpoint
      const response = await fetch('/api/goals/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update with the actual data from the server
      const updatedGoals = await response.json()
      setGoals(updatedGoals)
    } catch (err) {
      console.error('Error reordering goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder goals')
      // Revert optimistic update
      await fetchGoals()
    } finally {
      setLoading(false)
    }
  }, [goals, fetchGoals])

  const reorderGoalTasks = useCallback(async (goalId: string, taskIds: string[]) => {
    try {
      setError(null)
      const response = await fetch(`/api/goals/${goalId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder tasks')
      }

      const goal = goals.find(g => g.id === goalId)
      if (goal) {
        const reorderedTasks = taskIds.map(id => (goal as any).tasks?.find((t: any) => t.id === id)).filter(Boolean) as GoalTask[]
        
        setGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === goalId 
              ? { ...g, tasks: reorderedTasks }
              : g
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks')
      throw err
    }
  }, [goals])

  const refreshGoals = useCallback(async () => {
    if (status === 'authenticated' && session?.user) {
      await fetchGoals()
    }
  }, [fetchGoals, status, session?.user])

  // Only fetch goals when user authentication status changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchGoals()
    } else if (status === 'unauthenticated') {
      setGoals([])
      setLoading(false)
      setError(null)
    }
  }, [status, session?.user]) // Only depend on status and user, not fetchGoals

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalTask,
    updateGoalTask,
    toggleGoalTask,
    deleteGoalTask,
    reorderGoals,
    reorderGoalTasks,
    refreshGoals,
  }
}
