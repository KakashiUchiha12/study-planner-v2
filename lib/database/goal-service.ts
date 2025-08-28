import { dbService } from './database-service'
import type { Goal, GoalTask } from './index'

const prisma = dbService.getPrisma()

export interface CreateGoalData {
  title: string
  description: string
  targetDate: Date
  category: 'academic' | 'personal' | 'career'
  status?: 'active' | 'completed' | 'paused'
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  // Progress is now calculated automatically from completed tasks
  // All other fields are optional for updates
  id?: string // Allow updating the goal ID if needed
}

export interface CreateGoalTaskData {
  title: string
  completed?: boolean
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
}

export interface UpdateGoalTaskData extends Partial<CreateGoalTaskData> {
  // Extends all properties from CreateGoalTaskData as optional
  // All fields are optional for updates
  id?: string // Allow updating the task ID if needed
}

export class GoalService {
  /**
   * Get all goals for a user
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      return await prisma.goal.findMany({
        where: { userId },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching user goals:', error)
      throw new Error('Failed to fetch user goals')
    }
  }

  /**
   * Get goal by ID with tasks
   */
  async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      return await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching goal:', error)
      throw new Error('Failed to fetch goal')
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(userId: string, data: CreateGoalData): Promise<Goal> {
    try {
      // Shift all existing goals down by 1 to make room for new goal at top
      await prisma.goal.updateMany({
        where: { userId },
        data: {
          order: {
            increment: 1
          }
        }
      })

      // Create new goal with order 0 (top position)
      return await prisma.goal.create({
        data: {
          ...data,
          userId,
          order: 0
        },
        include: {
          tasks: true
        }
      })
    } catch (error) {
      console.error('Error creating goal:', error)
      throw new Error('Failed to create goal')
    }
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, data: UpdateGoalData): Promise<Goal> {
    try {
      return await prisma.goal.update({
        where: { id: goalId },
        data,
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Error updating goal:', error)
      throw new Error('Failed to update goal')
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      await prisma.goal.delete({
        where: { id: goalId }
      })
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw new Error('Failed to delete goal')
    }
  }

  /**
   * Reorder goals
   */
  async reorderGoals(userId: string, goalIds: string[]): Promise<void> {
    try {
      const updates = goalIds.map((goalId, index) => 
        prisma.goal.update({
          where: { id: goalId },
          data: { order: index }
        })
      )
      
      await prisma.$transaction(updates)
    } catch (error) {
      console.error('Error reordering goals:', error)
      throw new Error('Failed to reorder goals')
    }
  }

  /**
   * Add a task to a goal
   */
  async addGoalTask(goalId: string, data: CreateGoalTaskData): Promise<GoalTask> {
    try {
      // Get the next order number for tasks
      const lastTask = await prisma.goalTask.findFirst({
        where: { goalId },
        orderBy: { order: 'desc' }
      })
      const nextOrder = (lastTask?.order ?? -1) + 1

      return await prisma.goalTask.create({
        data: {
          ...data,
          goalId,
          order: nextOrder
        }
      })
    } catch (error) {
      console.error('Error adding goal task:', error)
      throw new Error('Failed to add goal task')
    }
  }

  /**
   * Update a goal task
   */
  async updateGoalTask(taskId: string, data: UpdateGoalTaskData): Promise<GoalTask> {
    try {
      return await prisma.goalTask.update({
        where: { id: taskId },
        data
      })
    } catch (error) {
      console.error('Error updating goal task:', error)
      throw new Error('Failed to update goal task')
    }
  }

  /**
   * Toggle task completion
   */
  async toggleGoalTask(taskId: string): Promise<GoalTask> {
    try {
      const task = await prisma.goalTask.findUnique({
        where: { id: taskId }
      })
      
      if (!task) {
        throw new Error('Task not found')
      }

      return await prisma.goalTask.update({
        where: { id: taskId },
        data: { completed: !task.completed }
      })
    } catch (error) {
      console.error('Error toggling goal task:', error)
      throw new Error('Failed to toggle goal task')
    }
  }

  /**
   * Delete a goal task
   */
  async deleteGoalTask(taskId: string): Promise<void> {
    try {
      await prisma.goalTask.delete({
        where: { id: taskId }
      })
    } catch (error) {
      console.error('Error deleting goal task:', error)
      throw new Error('Failed to delete goal task')
    }
  }

  /**
   * Reorder tasks within a goal
   */
  async reorderGoalTasks(goalId: string, taskIds: string[]): Promise<void> {
    try {
      const updates = taskIds.map((taskId, index) => 
        prisma.goalTask.update({
          where: { id: taskId },
          data: { order: index }
        })
      )
      
      await prisma.$transaction(updates)
    } catch (error) {
      console.error('Error reordering goal tasks:', error)
      throw new Error('Failed to reorder goal tasks')
    }
  }

  /**
   * Calculate goal progress based on completed tasks
   */
  async calculateGoalProgress(goalId: string): Promise<number> {
    try {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { tasks: true }
      })

      if (!goal || goal.tasks.length === 0) {
        return 0
      }

      const completedTasks = goal.tasks.filter((task: GoalTask) => task.completed).length
      const progress = Math.round((completedTasks / goal.tasks.length) * 100)
      
      // Update the goal progress
      await prisma.goal.update({
        where: { id: goalId },
        data: { progress }
      })

      return progress
    } catch (error) {
      console.error('Error calculating goal progress:', error)
      throw new Error('Failed to calculate goal progress')
    }
  }
}

export const goalService = new GoalService()
