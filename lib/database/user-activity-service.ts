import { PrismaClient, UserActivity } from '@prisma/client'

export interface CreateActivityData {
  userId: string
  type: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

export class UserActivityService {
  private prisma = new PrismaClient()

  /**
   * Create a new user activity
   */
  async createActivity(data: CreateActivityData): Promise<UserActivity> {
    try {
      return await this.prisma.userActivity.create({
        data: {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      })
    } catch (error) {
      console.error('Error creating user activity:', error)
      throw new Error('Failed to create user activity')
    }
  }

  /**
   * Get recent activities for a user
   */
  async getRecentActivities(userId: string, limit: number = 10): Promise<UserActivity[]> {
    try {
      return await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      throw new Error('Failed to fetch recent activities')
    }
  }

  /**
   * Get all activities for a user with pagination
   */
  async getUserActivities(userId: string, page: number = 1, pageSize: number = 20): Promise<{
    activities: UserActivity[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    try {
      const skip = (page - 1) * pageSize
      
      const [activities, total] = await Promise.all([
        this.prisma.userActivity.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          skip,
          take: pageSize
        }),
        this.prisma.userActivity.count({
          where: { userId }
        })
      ])

      return {
        activities,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    } catch (error) {
      console.error('Error fetching user activities:', error)
      throw new Error('Failed to fetch user activities')
    }
  }

  /**
   * Mark activity as read
   */
  async markAsRead(activityId: string): Promise<UserActivity> {
    try {
      return await this.prisma.userActivity.update({
        where: { id: activityId },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking activity as read:', error)
      throw new Error('Failed to mark activity as read')
    }
  }

  /**
   * Mark all activities as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.userActivity.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking all activities as read:', error)
      throw new Error('Failed to mark all activities as read')
    }
  }

  /**
   * Delete old activities (cleanup)
   */
  async deleteOldActivities(userId: string, daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.userActivity.deleteMany({
        where: {
          userId,
          timestamp: { lt: cutoffDate }
        }
      })

      return result.count
    } catch (error) {
      console.error('Error deleting old activities:', error)
      throw new Error('Failed to delete old activities')
    }
  }

  /**
   * Get activity statistics for a user
   */
  async getActivityStats(userId: string): Promise<{
    total: number
    unread: number
    today: number
    thisWeek: number
    thisMonth: number
  }> {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [total, unread, todayCount, thisWeekCount, thisMonthCount] = await Promise.all([
        this.prisma.userActivity.count({ where: { userId } }),
        this.prisma.userActivity.count({ where: { userId, isRead: false } }),
        this.prisma.userActivity.count({ where: { userId, timestamp: { gte: today } } }),
        this.prisma.userActivity.count({ where: { userId, timestamp: { gte: thisWeek } } }),
        this.prisma.userActivity.count({ where: { userId, timestamp: { gte: thisMonth } } })
      ])

      return {
        total,
        unread,
        today: todayCount,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error)
      throw new Error('Failed to fetch activity stats')
    }
  }
}

// Export singleton instance
export const userActivityService = new UserActivityService()
