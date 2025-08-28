import { dbService } from './database-service'
import { Subject, Prisma } from '@prisma/client'

export interface CreateSubjectData {
  name: string
  color: string
  description?: string
  progress?: number
  totalChapters?: number
  completedChapters?: number
}

export interface UpdateSubjectData {
  name?: string
  color?: string
  description?: string
  progress?: number
  totalChapters?: number
  completedChapters?: number
}

export class SubjectService {
  private prisma = dbService.getPrisma()

  // Get all subjects for a user
  async getSubjectsByUserId(userId: string): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get subjects:', error)
      throw new Error('Failed to fetch subjects')
    }
  }

  // Get a single subject by ID
  async getSubjectById(subjectId: string): Promise<Subject | null> {
    try {
      return await this.prisma.subject.findUnique({
        where: { id: subjectId }
      })
    } catch (error) {
      console.error('Failed to get subject:', error)
      throw new Error('Failed to fetch subject')
    }
  }

  // Create a new subject
  async createSubject(userId: string, data: CreateSubjectData): Promise<Subject> {
    try {
      return await this.prisma.subject.create({
        data: {
          id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          name: data.name,
          color: data.color,
          description: data.description || '',
          progress: data.progress || 0,
          totalChapters: data.totalChapters || 0,
          completedChapters: data.completedChapters || 0
        }
      })
    } catch (error) {
      console.error('Failed to create subject:', error)
      throw new Error('Failed to create subject')
    }
  }

  // Update an existing subject
  async updateSubject(subjectId: string, data: UpdateSubjectData): Promise<Subject> {
    try {
      return await this.prisma.subject.update({
        where: { id: subjectId },
        data: {
          name: data.name,
          color: data.color,
          description: data.description,
          progress: data.progress,
          totalChapters: data.totalChapters,
          completedChapters: data.completedChapters,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update subject:', error)
      throw new Error('Failed to update subject')
    }
  }

  // Delete a subject
  async deleteSubject(subjectId: string): Promise<void> {
    try {
      await this.prisma.subject.delete({
        where: { id: subjectId }
      })
    } catch (error) {
      console.error('Failed to delete subject:', error)
      throw new Error('Failed to delete subject')
    }
  }

  // Update subject progress
  async updateSubjectProgress(subjectId: string, completedChapters: number, totalChapters: number): Promise<Subject> {
    try {
      const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
      
      return await this.prisma.subject.update({
        where: { id: subjectId },
        data: {
          completedChapters: completedChapters,
          totalChapters: totalChapters,
          progress,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update subject progress:', error)
      throw new Error('Failed to update subject progress')
    }
  }

  // Update subject progress automatically based on chapters
  async updateSubjectProgressFromChapters(subjectId: string): Promise<Subject> {
    try {
      const [total, completed] = await Promise.all([
        this.prisma.chapter.count({
          where: { subjectId: subjectId }
        }),
        this.prisma.chapter.count({
          where: { 
            subjectId: subjectId,
            isCompleted: true
          }
        })
      ])

      return await this.updateSubjectProgress(subjectId, completed, total)
    } catch (error) {
      console.error('Failed to update subject progress from chapters:', error)
      throw new Error('Failed to update subject progress from chapters')
    }
  }

  // Search subjects by name
  async searchSubjects(userId: string, query: string): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany({
        where: {
          userId: userId,
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to search subjects:', error)
      throw new Error('Failed to search subjects')
    }
  }

  // Get subjects with task counts
  async getSubjectsWithTaskCounts(userId: string): Promise<(Subject & { taskCount: number })[]> {
    try {
      const subjects = await this.prisma.subject.findMany({
        where: { userId: userId },
        include: {
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return subjects.map(subject => ({
        ...subject,
        taskCount: subject._count.tasks
      }))
    } catch (error) {
      console.error('Failed to get subjects with task counts:', error)
      throw new Error('Failed to fetch subjects with task counts')
    }
  }
}

// Export singleton instance
export const subjectService = new SubjectService()
