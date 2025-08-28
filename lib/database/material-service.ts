import { dbService } from './database-service'
import { Material, Prisma } from '@prisma/client'
import { chapterService } from './chapter-service'

export interface CreateMaterialData {
  chapterId: string
  title: string
  type: string
  content?: string
  fileUrl?: string
  fileSize?: number
  duration?: number
  order: number
}

export interface UpdateMaterialData {
  title?: string
  type?: string
  content?: string
  fileUrl?: string
  fileSize?: number
  duration?: number
  order?: number
  isCompleted?: boolean
}

export class MaterialService {
  private prisma = dbService.getPrisma()

  // Get all materials for a chapter
  async getMaterialsByChapterId(chapterId: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: { chapterId: chapterId },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Failed to get materials:', error)
      throw new Error('Failed to fetch materials')
    }
  }

  // Get all materials for a subject
  async getMaterialsBySubjectId(subjectId: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: {
          chapter: {
            subjectId: subjectId
          }
        },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
              order: true
            }
          }
        },
        orderBy: [
          { chapter: { order: 'asc' } },
          { order: 'asc' }
        ]
      })
    } catch (error) {
      console.error('Failed to get materials:', error)
      throw new Error('Failed to fetch materials')
    }
  }

  // Get a single material by ID
  async getMaterialById(materialId: string): Promise<Material | null> {
    try {
      return await this.prisma.material.findUnique({
        where: { id: materialId }
      })
    } catch (error) {
      console.error('Failed to get material:', error)
      throw new Error('Failed to fetch material')
    }
  }

  // Create a new material
  async createMaterial(data: CreateMaterialData): Promise<Material> {
    try {
      return await this.prisma.material.create({
        data: {
          chapterId: data.chapterId,
          title: data.title,
          type: data.type,
          content: data.content || '',
          fileUrl: data.fileUrl || '',
          fileSize: data.fileSize || 0,
          duration: data.duration || 0,
          order: data.order
        }
      })
    } catch (error) {
      console.error('Failed to create material:', error)
      throw new Error('Failed to create material')
    }
  }

  // Update an existing material
  async updateMaterial(materialId: string, data: UpdateMaterialData): Promise<Material> {
    try {
      return await this.prisma.material.update({
        where: { id: materialId },
        data: {
          title: data.title,
          type: data.type,
          content: data.content,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          duration: data.duration,
          order: data.order,
          isCompleted: data.isCompleted
        }
      })
    } catch (error) {
      console.error('Failed to update material:', error)
      throw new Error('Failed to update material')
    }
  }

  // Delete a material
  async deleteMaterial(materialId: string): Promise<void> {
    try {
      await this.prisma.material.delete({
        where: { id: materialId }
      })
    } catch (error) {
      console.error('Failed to delete material:', error)
      throw new Error('Failed to delete material')
    }
  }

  // Toggle material completion
  async toggleMaterialCompletion(materialId: string): Promise<Material> {
    try {
      const material = await this.prisma.material.findUnique({
        where: { id: materialId }
      })

      if (!material) {
        throw new Error('Material not found')
      }

      const updatedMaterial = await this.prisma.material.update({
        where: { id: materialId },
        data: {
          isCompleted: !material.isCompleted
        }
      })

      // Update chapter completion status based on materials
              await this.updateChapterCompletionFromMaterials(material.chapterId)

      return updatedMaterial
    } catch (error) {
      console.error('Failed to toggle material completion:', error)
      throw new Error('Failed to toggle material completion')
    }
  }

  // Reorder materials within a chapter
  async reorderMaterials(chapterId: string, materialOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const updates = materialOrders.map(({ id, order }) =>
        this.prisma.material.update({
          where: { id },
          data: { order }
        })
      )

      await this.prisma.$transaction(updates)
    } catch (error) {
      console.error('Failed to reorder materials:', error)
      throw new Error('Failed to reorder materials')
    }
  }

  // Get material count for a chapter
  async getMaterialCount(chapterId: string): Promise<{ total: number; completed: number }> {
    try {
      const [total, completed] = await Promise.all([
        this.prisma.material.count({
          where: { chapterId: chapterId }
        }),
        this.prisma.material.count({
          where: { 
            chapterId: chapterId,
            isCompleted: true
          }
        })
      ])

      return { total, completed }
    } catch (error) {
      console.error('Failed to get material count:', error)
      throw new Error('Failed to get material count')
    }
  }

  // Get materials by type for a subject
  async getMaterialsByType(subjectId: string, type: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: {
          type,
          chapter: {
            subjectId: subjectId
          }
        },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
              order: true
            }
          }
        },
        orderBy: [
          { chapter: { order: 'asc' } },
          { order: 'asc' }
        ]
      })
    } catch (error) {
      console.error('Failed to get materials by type:', error)
      throw new Error('Failed to fetch materials by type')
    }
  }

  // Update chapter completion status based on materials
  private async updateChapterCompletionFromMaterials(chapterId: string): Promise<void> {
    try {
      const [total, completed] = await Promise.all([
        this.prisma.material.count({
          where: { chapterId: chapterId }
        }),
        this.prisma.material.count({
          where: { 
            chapterId: chapterId,
            isCompleted: true
          }
        })
      ])

      // If all materials are completed, mark chapter as completed
      // If any material is not completed, mark chapter as not completed
      const isChapterCompleted = total > 0 && completed === total

      await this.prisma.chapter.update({
        where: { id: chapterId },
        data: {
          isCompleted: isChapterCompleted
        }
      })
    } catch (error) {
      console.error('Failed to update chapter completion from materials:', error)
      // Don't throw error as this is a side effect
    }
  }
}

// Export singleton instance
export const materialService = new MaterialService()
