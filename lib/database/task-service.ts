import { dbService } from './database-service'
import { Task, Prisma } from '@prisma/client'

export interface CreateTaskData {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date
  subjectId?: string
  estimatedTime?: number
  tags?: string[]
  progress?: number
  timeSpent?: number
}

export interface UpdateTaskData {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date
  subjectId?: string
  estimatedTime?: number
  tags?: string[]
  progress?: number
  timeSpent?: number
  completedAt?: Date
}

export class TaskService {
  private prisma = dbService.getPrisma()

  // Get all tasks for a user
  async getTasksByUserId(userId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: { userId: userId },
        include: {
          subject: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get tasks:', error)
      throw new Error('Failed to fetch tasks')
    }
  }

  // Get tasks by subject
  async getTasksBySubjectId(subjectId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: { subjectId: subjectId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get tasks by subject:', error)
      throw new Error('Failed to fetch tasks by subject')
    }
  }

  // Get a single task by ID
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      return await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          subject: true
        }
      })
    } catch (error) {
      console.error('Failed to get task:', error)
      throw new Error('Failed to fetch task')
    }
  }

  // Create a new task
  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    try {
      return await this.prisma.task.create({
        data: {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate,
          subjectId: data.subjectId,
          estimatedTime: data.estimatedTime || 0,
          tags: data.tags || [],
          progress: data.progress || 0,
          timeSpent: data.timeSpent || 0
        }
      })
    } catch (error) {
      console.error('Failed to create task:', error)
      throw new Error('Failed to create task')
    }
  }

  // Update an existing task
  async updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
    try {
      const updateData: any = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        subjectId: data.subjectId,
        estimatedTime: data.estimatedTime,
        tags: data.tags,
        progress: data.progress,
        timeSpent: data.timeSpent,
        updatedAt: new Date()
      }

      // Set completed_at when status changes to completed
      if (data.status === 'completed' && !data.completedAt) {
        updateData.completedAt = new Date()
      } else if (data.status !== 'completed') {
        updateData.completedAt = null
      }

      return await this.prisma.task.update({
        where: { id: taskId },
        data: updateData
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      throw new Error('Failed to update task')
    }
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.prisma.task.delete({
        where: { id: taskId }
      })
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw new Error('Failed to delete task')
    }
  }

  // Toggle task completion
  async toggleTaskComplete(taskId: string): Promise<Task> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId }
      })

      if (!task) {
        throw new Error('Task not found')
      }

      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      const completedAt = newStatus === 'completed' ? new Date() : null

      return await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
                  completedAt: completedAt,
        updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      throw new Error('Failed to toggle task completion')
    }
  }

  // Update task progress
  async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id: taskId },
        data: {
          progress: Math.max(0, Math.min(100, progress)), // Ensure progress is between 0-100
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update task progress:', error)
      throw new Error('Failed to update task progress')
    }
  }

  // Update time spent on task
  async updateTaskTimeSpent(taskId: string, timeSpent: number): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id: taskId },
        data: {
          timeSpent: Math.max(0, timeSpent), // Ensure time spent is not negative
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update task time spent:', error)
      throw new Error('Failed to update task time spent')
    }
  }

  // Search tasks
  async searchTasks(userId: string, query: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          userId: userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } }
          ]
        },
        include: {
          subject: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to search tasks:', error)
      throw new Error('Failed to search tasks')
    }
  }

  // Get tasks by priority
  async getTasksByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          userId: userId,
          priority
        },
        include: {
          subject: true
        },
        orderBy: { dueDate: 'asc' }
      })
    } catch (error) {
      console.error('Failed to get tasks by priority:', error)
      throw new Error('Failed to fetch tasks by priority')
    }
  }

  // Get overdue tasks
  async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          userId: userId,
          dueDate: {
            lt: new Date()
          },
          status: {
            not: 'completed'
          }
        },
        include: {
          subject: true
        },
        orderBy: { dueDate: 'asc' }
      })
    } catch (error) {
      console.error('Failed to get overdue tasks:', error)
      throw new Error('Failed to fetch overdue tasks')
    }
  }
}

// Export singleton instance
export const taskService = new TaskService()
