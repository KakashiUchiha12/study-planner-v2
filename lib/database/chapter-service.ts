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
      console.log('[ChapterService] Creating chapter with data:', data)
      
      // If no order specified, calculate the next available order
      let order = data.order
      if (order === undefined) {
        const lastChapter = await this.prisma.chapter.findFirst({
          where: { subjectId: data.subjectId },
          orderBy: { order: 'desc' }
        })
        order = lastChapter ? lastChapter.order + 1 : 1
        console.log('[ChapterService] Auto-calculated order:', order)
      } else {
        // Check if the specified order already exists
        const existingChapter = await this.prisma.chapter.findFirst({
          where: { 
            subjectId: data.subjectId,
            order: order
          }
        })
        
        if (existingChapter) {
          // If order exists, find the next available order
          const lastChapter = await this.prisma.chapter.findFirst({
            where: { subjectId: data.subjectId },
            orderBy: { order: 'desc' }
          })
          order = lastChapter ? lastChapter.order + 1 : 1
          console.log('[ChapterService] Order conflict detected, using next available order:', order)
        }
      }

      const chapter = await this.prisma.chapter.create({
        data: {
          subjectId: data.subjectId,
          title: data.title,
          description: data.description || '',
          order: order,
          estimatedHours: data.estimatedHours || 2
        }
      })

      console.log('[ChapterService] Chapter created successfully:', chapter)

      // Update subject progress automatically
      console.log('[ChapterService] Updating subject progress...')
      await subjectService.updateSubjectProgressFromChapters(data.subjectId)
      console.log('[ChapterService] Subject progress updated successfully')

      return chapter
    } catch (error) {
      console.error('[ChapterService] Failed to create chapter:', error)
      console.error('[ChapterService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        data: data
      })
      throw new Error('Failed to create chapter')
    }
  }

  // Update an existing chapter
  async updateChapter(chapterId: string, data: UpdateChapterData): Promise<Chapter> {
    try {
      console.log('[ChapterService] Updating chapter with data:', { chapterId, data })
      
      // Get the current chapter to check its subject
      const currentChapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      })

      if (!currentChapter) {
        throw new Error('Chapter not found')
      }

      // If order is being updated, handle potential conflicts
      if (data.order !== undefined && data.order !== currentChapter.order) {
        console.log('[ChapterService] Order is being updated, checking for conflicts...')
        
        // Check if another chapter already has this order
        const conflictingChapter = await this.prisma.chapter.findFirst({
          where: { 
            subjectId: currentChapter.subjectId,
            order: data.order,
            id: { not: chapterId } // Exclude current chapter
          }
        })

        if (conflictingChapter) {
          console.log('[ChapterService] Order conflict detected, swapping orders...')
          
          // Swap the orders: temporarily set conflicting chapter to a high number
          const maxOrder = await this.prisma.chapter.findFirst({
            where: { subjectId: currentChapter.subjectId },
            orderBy: { order: 'desc' }
          })
          const tempOrder = (maxOrder?.order || 0) + 1
          
          // Update conflicting chapter to temp order
          await this.prisma.chapter.update({
            where: { id: conflictingChapter.id },
            data: { order: tempOrder }
          })
          
          console.log('[ChapterService] Swapped orders, updating current chapter...')
        }
      }

      const updatedChapter = await this.prisma.chapter.update({
        where: { id: chapterId },
        data: {
          title: data.title,
          description: data.description,
          order: data.order,
          estimatedHours: data.estimatedHours,
          isCompleted: data.isCompleted
        }
      })

      console.log('[ChapterService] Chapter updated successfully:', updatedChapter)
      return updatedChapter
    } catch (error) {
      console.error('[ChapterService] Failed to update chapter:', error)
      console.error('[ChapterService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        chapterId,
        data
      })
      throw new Error('Failed to update chapter')
    }
  }

  // Reorder chapters in bulk (for drag and drop)
  async reorderChapters(subjectId: string, chapterOrders: { id: string; order: number }[]): Promise<void> {
    try {
      console.log('[ChapterService] Reordering chapters:', { subjectId, chapterOrders })
      
      // Use a transaction to ensure all updates succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        for (const { id, order } of chapterOrders) {
          await prisma.chapter.update({
            where: { id },
            data: { order }
          })
        }
      })
      
      console.log('[ChapterService] Chapters reordered successfully')
    } catch (error) {
      console.error('[ChapterService] Failed to reorder chapters:', error)
      throw new Error('Failed to reorder chapters')
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
