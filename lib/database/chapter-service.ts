import { dbService } from './database-service'
import { Chapter, Prisma } from '@prisma/client'
import { subjectService } from './subject-service'

export interface CreateChapterData {
  subjectId: string
  title: string
  description?: string
  order: number
  estimatedHours?: number
}

export interface UpdateChapterData {
  title?: string
  description?: string
  order?: number
  estimatedHours?: number
  isCompleted?: boolean
}

export class ChapterService {
  private prisma = dbService.getPrisma()

  // Get all chapters for a subject
  async getChaptersBySubjectId(subjectId: string): Promise<Chapter[]> {
    try {
      return await this.prisma.chapter.findMany({
        where: { subjectId: subjectId },
        orderBy: { order: 'asc' },
        include: {
          materials: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Failed to get chapters:', error)
      throw new Error('Failed to fetch chapters')
    }
  }

  // Get a single chapter by ID
  async getChapterById(chapterId: string): Promise<Chapter | null> {
    try {
      return await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          materials: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Failed to get chapter:', error)
      throw new Error('Failed to fetch chapter')
    }
  }

  // Create a new chapter
  async createChapter(data: CreateChapterData): Promise<Chapter> {
    try {
      const chapter = await this.prisma.chapter.create({
        data: {
          subjectId: data.subjectId,
          title: data.title,
          description: data.description || '',
          order: data.order,
          estimatedHours: data.estimatedHours || 2
        }
      })

      // Update subject progress automatically
      await subjectService.updateSubjectProgressFromChapters(data.subjectId)

      return chapter
    } catch (error) {
      console.error('Failed to create chapter:', error)
      throw new Error('Failed to create chapter')
    }
  }

  // Update an existing chapter
  async updateChapter(chapterId: string, data: UpdateChapterData): Promise<Chapter> {
    try {
      return await this.prisma.chapter.update({
        where: { id: chapterId },
        data: {
          title: data.title,
          description: data.description,
          order: data.order,
          estimatedHours: data.estimatedHours,
          isCompleted: data.isCompleted
        }
      })
    } catch (error) {
      console.error('Failed to update chapter:', error)
      throw new Error('Failed to update chapter')
    }
  }

  // Delete a chapter
  async deleteChapter(chapterId: string): Promise<void> {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      })

      if (!chapter) {
        throw new Error('Chapter not found')
      }

      await this.prisma.chapter.delete({
        where: { id: chapterId }
      })

      // Update subject progress automatically
      await subjectService.updateSubjectProgressFromChapters(chapter.subjectId)
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      throw new Error('Failed to delete chapter')
    }
  }

  // Toggle chapter completion
  async toggleChapterCompletion(chapterId: string): Promise<Chapter> {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      })

      if (!chapter) {
        throw new Error('Chapter not found')
      }

      const updatedChapter = await this.prisma.chapter.update({
        where: { id: chapterId },
        data: {
          isCompleted: !chapter.isCompleted
        }
      })

      // Update subject progress automatically
      await subjectService.updateSubjectProgressFromChapters(chapter.subjectId)

      return updatedChapter
    } catch (error) {
      console.error('Failed to toggle chapter completion:', error)
      throw new Error('Failed to toggle chapter completion')
    }
  }

  // Reorder chapters
  async reorderChapters(subjectId: string, chapterOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const updates = chapterOrders.map(({ id, order }) =>
        this.prisma.chapter.update({
          where: { id },
          data: { order }
        })
      )

      await this.prisma.$transaction(updates)
    } catch (error) {
      console.error('Failed to reorder chapters:', error)
      throw new Error('Failed to reorder chapters')
    }
  }

  // Get chapter count for a subject
  async getChapterCount(subjectId: string): Promise<{ total: number; completed: number }> {
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

      return { total, completed }
    } catch (error) {
      console.error('Failed to get chapter count:', error)
      throw new Error('Failed to get chapter count')
    }
  }
}

// Export singleton instance
export const chapterService = new ChapterService()
