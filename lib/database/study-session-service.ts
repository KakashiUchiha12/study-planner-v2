import { dbService } from './database-service'
import { StudySession, Prisma } from '@prisma/client'

export interface CreateStudySessionData {
  subjectId?: string
  duration: number
  startTime: Date
  endTime: Date
  notes?: string
  efficiency?: number
  sessionType?: 'Focused Study' | 'Review' | 'Practice' | 'Group Study'
  productivity?: number
  topicsCovered?: string[]
  materialsUsed?: string[]
}

export interface UpdateStudySessionData {
  subjectId?: string
  duration?: number
  startTime?: Date
  endTime?: Date
  notes?: string
  efficiency?: number
  sessionType?: 'Focused Study' | 'Review' | 'Practice' | 'Group Study'
  productivity?: number
  topicsCovered?: string[]
  materialsUsed?: string[]
}

export class StudySessionService {
  private prisma = dbService.getPrisma()

  // Get all study sessions for a user
  async getStudySessionsByUserId(userId: string): Promise<StudySession[]> {
    try {
      return await this.prisma.studySession.findMany({
        where: { userId: userId },
        include: {
          subject: true
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get study sessions:', error)
      throw new Error('Failed to fetch study sessions')
    }
  }

  // Get study sessions by subject
  async getStudySessionsBySubjectId(subjectId: string): Promise<StudySession[]> {
    try {
      return await this.prisma.studySession.findMany({
        where: { subjectId: subjectId },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get study sessions by subject:', error)
      throw new Error('Failed to fetch study sessions by subject')
    }
  }

  // Get a single study session by ID
  async getStudySessionById(sessionId: string): Promise<StudySession | null> {
    try {
      return await this.prisma.studySession.findUnique({
        where: { id: sessionId },
        include: {
          subject: true
        }
      })
    } catch (error) {
      console.error('Failed to get study session:', error)
      throw new Error('Failed to fetch study session')
    }
  }

  // Create a new study session
  async createStudySession(userId: string, data: CreateStudySessionData): Promise<StudySession> {
    try {
      return await this.prisma.studySession.create({
        data: {
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          subjectId: data.subjectId,
          durationMinutes: data.duration,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes || '',
          efficiency: data.efficiency || 0,
          sessionType: data.sessionType || 'Focused Study',
          productivity: data.productivity || 0,
          topicsCovered: data.topicsCovered || [],
          materialsUsed: data.materialsUsed || []
        }
      })
    } catch (error) {
      console.error('Failed to create study session:', error)
      throw new Error('Failed to create study session')
    }
  }

  // Update an existing study session
  async updateStudySession(sessionId: string, data: UpdateStudySessionData): Promise<StudySession> {
    try {
      return await this.prisma.studySession.update({
        where: { id: sessionId },
        data: {
          subjectId: data.subjectId,
          durationMinutes: data.duration,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          efficiency: data.efficiency,
          sessionType: data.sessionType,
          productivity: data.productivity,
          topicsCovered: data.topicsCovered,
          materialsUsed: data.materialsUsed
        }
      })
    } catch (error) {
      console.error('Failed to update study session:', error)
      throw new Error('Failed to update study session')
    }
  }

  // Delete a study session
  async deleteStudySession(sessionId: string): Promise<void> {
    try {
      await this.prisma.studySession.delete({
        where: { id: sessionId }
      })
    } catch (error) {
      console.error('Failed to delete study session:', error)
      throw new Error('Failed to delete study session')
    }
  }

  // Get study sessions by date range
  async getStudySessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<StudySession[]> {
    try {
      return await this.prisma.studySession.findMany({
        where: {
          userId: userId,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          subject: true
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get study sessions by date range:', error)
      throw new Error('Failed to fetch study sessions by date range')
    }
  }

  // Get study sessions by week
  async getStudySessionsByWeek(userId: string, weekStart: Date): Promise<StudySession[]> {
    try {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      return await this.prisma.studySession.findMany({
        where: {
          userId: userId,
          startTime: {
            gte: weekStart,
            lt: weekEnd
          }
        },
        include: {
          subject: true
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get study sessions by week:', error)
      throw new Error('Failed to fetch study sessions by week')
    }
  }

  // Get study sessions by month
  async getStudySessionsByMonth(userId: string, year: number, month: number): Promise<StudySession[]> {
    try {
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

      return await this.prisma.studySession.findMany({
        where: {
          userId: userId,
          startTime: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        include: {
          subject: true
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get study sessions by month:', error)
      throw new Error('Failed to fetch study sessions by month')
    }
  }

  // Search study sessions
  async searchStudySessions(userId: string, query: string): Promise<StudySession[]> {
    try {
      return await this.prisma.studySession.findMany({
        where: {
          userId: userId,
          OR: [
            { notes: { contains: query, mode: 'insensitive' } },
            { topicsCovered: { hasSome: [query] } },
            { materialsUsed: { hasSome: [query] } }
          ]
        },
        include: {
          subject: true
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (error) {
      console.error('Failed to search study sessions:', error)
      throw new Error('Failed to search study sessions')
    }
  }

  // Get total study time for a user
  async getTotalStudyTime(userId: string): Promise<number> {
    try {
      const result = await this.prisma.studySession.aggregate({
        where: { userId: userId },
        _sum: { durationMinutes: true }
      })
      return result._sum.durationMinutes || 0
    } catch (error) {
      console.error('Failed to get total study time:', error)
      throw new Error('Failed to fetch total study time')
    }
  }

  // Get study time by subject
  async getStudyTimeBySubject(userId: string): Promise<{ subjectId: string; subjectName: string; totalMinutes: number }[]> {
    try {
              const sessions = await this.prisma.studySession.findMany({
          where: { userId: userId },
          include: {
            subject: true
          }
        })

      const subjectTimeMap = new Map<string, { subjectName: string; totalMinutes: number }>()

      sessions.forEach(session => {
        const subjectId = session.subjectId || 'unknown'
        const subjectName = session.subject?.name || 'Unknown Subject'
        const current = subjectTimeMap.get(subjectId) || { subjectName, totalMinutes: 0 }
        
        subjectTimeMap.set(subjectId, {
          subjectName,
          totalMinutes: current.totalMinutes + session.durationMinutes
        })
      })

      return Array.from(subjectTimeMap.entries()).map(([subjectId, data]) => ({
        subjectId,
        subjectName: data.subjectName,
        totalMinutes: data.totalMinutes
      }))
    } catch (error) {
      console.error('Failed to get study time by subject:', error)
      throw new Error('Failed to fetch study time by subject')
    }
  }

  // Get study statistics
  async getStudyStatistics(userId: string, days: number = 30): Promise<{
    totalSessions: number
    totalMinutes: number
    averageSessionLength: number
    averageEfficiency: number
    averageProductivity: number
  }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const sessions = await this.prisma.studySession.findMany({
        where: {
          userId: userId,
          startTime: { gte: cutoffDate }
        }
      })

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          averageSessionLength: 0,
          averageEfficiency: 0,
          averageProductivity: 0
        }
      }

      const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
      const totalEfficiency = sessions.reduce((sum, session) => sum + (session.efficiency || 0), 0)
      const totalProductivity = sessions.reduce((sum, session) => sum + (session.productivity || 0), 0)

      return {
        totalSessions: sessions.length,
        totalMinutes,
        averageSessionLength: Math.round(totalMinutes / sessions.length),
        averageEfficiency: Math.round(totalEfficiency / sessions.length),
        averageProductivity: Math.round(totalProductivity / sessions.length)
      }
    } catch (error) {
      console.error('Failed to get study statistics:', error)
      throw new Error('Failed to fetch study statistics')
    }
  }
}

// Export singleton instance
export const studySessionService = new StudySessionService()
