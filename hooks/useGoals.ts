import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Goal, GoalTask, CreateGoalData, UpdateGoalData, CreateGoalTaskData, UpdateGoalTaskData } from '@/lib/database'

interface UseGoalsReturn {
  goals: Goal[]
  loading: boolean
  error: string | null
  createGoal: (data: CreateGoalData) => Promise<void>
  updateGoal: (goalId: string, data: UpdateGoalData) => Promise<void>
  deleteGoal: (goalId: string) => Promise<void>
  addGoalTask: (goalId: string, data: CreateGoalTaskData) => Promise<void>
  updateGoalTask: (taskId: string, data: UpdateGoalTaskData) => Promise<void>
  toggleGoalTask: (taskId: string) => Promise<void>
  deleteGoalTask: (taskId: string) => Promise<void>
  reorderGoals: (goalIds: string[]) => Promise<void>
  reorderGoalTasks: (goalId: string, taskIds: string[]) => Promise<void>
  refreshGoals: () => Promise<void>
}

export function useGoals(): UseGoalsReturn {
  const { data: session, status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/goals', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setGoals(data)
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }, [])

  const createGoal = useCallback(async (data: CreateGoalData) => {
    // Only create if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
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
  }, [session?.user?.id, status])

  const updateGoal = useCallback(async (goalId: string, data: UpdateGoalData) => {
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

  const addGoalTask = useCallback(async (goalId: string, data: CreateGoalTaskData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/goals/${goalId}/tasks`, {
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
      
      const newTask = await response.json()
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, tasks: [...goal.tasks, newTask] }
          : goal
      ))
    } catch (err) {
      console.error('Error adding goal task:', err)
      setError(err instanceof Error ? err.message : 'Failed to add goal task')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGoalTask = useCallback(async (taskId: string, data: UpdateGoalTaskData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the goal that contains this task
      const goal = goals.find(g => g.tasks.some(t => t.id === taskId))
      if (!goal) {
        throw new Error('Goal not found for task')
      }
      
      const response = await fetch(`/api/goals/${goal.id}/tasks/${taskId}`, {
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
      
      const updatedTask = await response.json()
      setGoals(prev => prev.map(g => 
        g.id === goal.id 
          ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? updatedTask : t) }
          : g
      ))
    } catch (err) {
      console.error('Error updating goal task:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal task')
      throw err
    } finally {
      setLoading(false)
    }
  }, [goals])

  const toggleGoalTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the goal that contains this task
      const goal = goals.find(g => g.tasks.some(t => t.id === taskId))
      if (!goal) {
        throw new Error('Goal not found for task')
      }
      
      const task = goal.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }
      
      const response = await fetch(`/api/goals/${goal.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedTask = await response.json()
      setGoals(prev => prev.map(g => 
        g.id === goal.id 
          ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? updatedTask : t) }
          : g
      ))
    } catch (err) {
      console.error('Error toggling goal task:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle goal task')
      throw err
    } finally {
      setLoading(false)
    }
  }, [goals])

  const deleteGoalTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the goal that contains this task
      const goal = goals.find(g => g.tasks.some(t => t.id === taskId))
      if (!goal) {
        throw new Error('Goal not found for task')
      }
      
      const response = await fetch(`/api/goals/${goal.id}/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setGoals(prev => prev.map(g => 
        g.id === goal.id 
          ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) }
          : g
      ))
    } catch (err) {
      console.error('Error deleting goal task:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal task')
      throw err
    } finally {
      setLoading(false)
    }
  }, [goals])

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
      setLoading(true)
      setError(null)
      
      const goal = goals.find(g => g.id === goalId)
      if (!goal) {
        throw new Error('Goal not found')
      }
      
      // Optimistically update the UI
      const reorderedTasks = taskIds.map(id => goal.tasks.find(t => t.id === id)).filter(Boolean) as GoalTask[]
      setGoals(prev => prev.map(g => 
        g.id === goalId ? { ...g, tasks: reorderedTasks } : g
      ))
      
      // TODO: Implement reorder API call when endpoint is available
      // const response = await fetch(`/api/goals/${goalId}/tasks/reorder`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ taskIds }),
      // })
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`)
      // }
    } catch (err) {
      console.error('Error reordering goal tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder goal tasks')
      // Revert optimistic update
      await fetchGoals()
    } finally {
      setLoading(false)
    }
  }, [goals, fetchGoals])

  const refreshGoals = useCallback(async () => {
    await fetchGoals()
  }, [fetchGoals])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

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
