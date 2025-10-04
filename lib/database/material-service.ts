import { dbService } from './database-service'
import { Material, Prisma } from '@prisma/client'

export interface CreateMaterialData {
  subjectId: string
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

  // Get all materials for a subject (prioritizes subject-linked materials)
  async getMaterialsBySubjectId(subjectId: string): Promise<Material[]> {
    try {
      console.log('[MaterialService] Getting materials for subject:', subjectId)
      
      // Get materials directly linked to subject
      const subjectMaterials = await this.prisma.material.findMany({
        where: { 
          subjectId: subjectId
        },
        orderBy: { order: 'asc' }
      })

      console.log('[MaterialService] Found subject materials:', subjectMaterials.length)

      // Get materials linked through chapters
      const chapterMaterials = await this.prisma.material.findMany({
        where: { 
          chapter: {
            subjectId: subjectId
          }
        },
        orderBy: { order: 'asc' }
      })

      console.log('[MaterialService] Found chapter materials:', chapterMaterials.length)

      // Combine and deduplicate
      const allMaterials = [...subjectMaterials, ...chapterMaterials]
      const uniqueMaterials = allMaterials.filter((material, index, self) => 
        index === self.findIndex(m => m.id === material.id)
      )

      console.log('[MaterialService] Total unique materials:', uniqueMaterials.length)
      return uniqueMaterials
    } catch (error) {
      console.error('[MaterialService] Failed to get materials:', error)
      console.error('[MaterialService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        subjectId
      })
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
      console.log('[MaterialService] Creating material with data:', data)
      
      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subjectId }
      })
      
      if (!subject) {
        throw new Error(`Subject with ID ${data.subjectId} not found`)
      }
      
      // Check for existing material with same order in the same subject
      const existingMaterial = await this.prisma.material.findFirst({
        where: {
          subjectId: data.subjectId,
          order: data.order
        }
      })
      
      if (existingMaterial) {
        // If order exists, find the next available order
        const lastMaterial = await this.prisma.material.findFirst({
          where: { subjectId: data.subjectId },
          orderBy: { order: 'desc' }
        })
        data.order = lastMaterial ? lastMaterial.order + 1 : 1
        console.log('[MaterialService] Order conflict detected, using next available order:', data.order)
      }

      const material = await this.prisma.material.create({
        data: {
          subjectId: data.subjectId,
          chapterId: null, // Materials are now independent of chapters
          title: data.title,
          type: data.type,
          content: data.content || '',
          fileUrl: data.fileUrl || '',
          fileSize: data.fileSize || 0,
          duration: data.duration || 0,
          order: data.order
        }
      })

      console.log('[MaterialService] Material created successfully:', material)
      return material
    } catch (error) {
      console.error('[MaterialService] Failed to create material:', error)
      console.error('[MaterialService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        data: data
      })
      throw new Error('Failed to create material')
    }
  }

  // Update an existing material
  async updateMaterial(materialId: string, data: UpdateMaterialData): Promise<Material> {
    try {
      console.log('[MaterialService] Updating material with data:', { materialId, data })
      
      // Get the current material to check its subject
      const currentMaterial = await this.prisma.material.findUnique({
        where: { id: materialId }
      })

      if (!currentMaterial) {
        throw new Error('Material not found')
      }

      // If order is being updated, handle potential conflicts
      if (data.order !== undefined && data.order !== currentMaterial.order) {
        console.log('[MaterialService] Order is being updated, checking for conflicts...')
        
        // Check if another material already has this order
        const conflictingMaterial = await this.prisma.material.findFirst({
          where: { 
            subjectId: currentMaterial.subjectId,
            order: data.order,
            id: { not: materialId } // Exclude current material
          }
        })

        if (conflictingMaterial) {
          console.log('[MaterialService] Order conflict detected, swapping orders...')
          
          // Swap the orders: temporarily set conflicting material to a high number
          const maxOrder = await this.prisma.material.findFirst({
            where: { subjectId: currentMaterial.subjectId },
            orderBy: { order: 'desc' }
          })
          const tempOrder = (maxOrder?.order || 0) + 1
          
          // Update conflicting material to temp order
          await this.prisma.material.update({
            where: { id: conflictingMaterial.id },
            data: { order: tempOrder }
          })
          
          console.log('[MaterialService] Swapped orders, updating current material...')
        }
      }

      const updatedMaterial = await this.prisma.material.update({
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

      console.log('[MaterialService] Material updated successfully:', updatedMaterial)
      return updatedMaterial
    } catch (error) {
      console.error('[MaterialService] Failed to update material:', error)
      console.error('[MaterialService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        materialId,
        data
      })
      throw new Error('Failed to update material')
    }
  }

  // Reorder materials in bulk (for drag and drop)
  async reorderMaterials(subjectId: string, materialOrders: { id: string; order: number }[]): Promise<void> {
    try {
      console.log('[MaterialService] Reordering materials:', { subjectId, materialOrders })
      
      // Use a transaction to ensure all updates succeed or fail together
      await this.prisma.$transaction(async (prisma) => {
        for (const { id, order } of materialOrders) {
          await prisma.material.update({
            where: { id },
            data: { order }
          })
        }
      })
      
      console.log('[MaterialService] Materials reordered successfully')
    } catch (error) {
      console.error('[MaterialService] Failed to reorder materials:', error)
      throw new Error('Failed to reorder materials')
    }
  }

  // Delete a material
  async deleteMaterial(materialId: string): Promise<void> {
    try {
      const material = await this.prisma.material.findUnique({
        where: { id: materialId }
      })

      if (!material) {
        throw new Error('Material not found')
      }

      await this.prisma.material.delete({
        where: { id: materialId }
      })

      console.log('[MaterialService] Material deleted successfully:', materialId)
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

      return await this.prisma.material.update({
        where: { id: materialId },
        data: { isCompleted: !material.isCompleted }
      })
    } catch (error) {
      console.error('Failed to toggle material completion:', error)
      throw new Error('Failed to toggle material completion')
    }
  }

  // Get materials by type
  async getMaterialsByType(subjectId: string, type: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: { 
          subjectId,
          type 
        },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Failed to fetch materials by type:', error)
      throw new Error('Failed to fetch materials')
    }
  }

  // Get completed materials
  async getCompletedMaterials(subjectId: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: { 
          subjectId,
          isCompleted: true 
        },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Failed to fetch completed materials:', error)
      throw new Error('Failed to fetch materials')
    }
  }

  // Get pending materials
  async getPendingMaterials(subjectId: string): Promise<Material[]> {
    try {
      return await this.prisma.material.findMany({
        where: { 
          subjectId,
          isCompleted: false 
        },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Failed to fetch pending materials:', error)
      throw new Error('Failed to fetch materials')
    }
  }

  // Get materials count by subject
  async getMaterialsCountBySubject(subjectId: string): Promise<{ total: number; completed: number; pending: number }> {
    try {
      const [total, completed] = await Promise.all([
        this.prisma.material.count({
          where: { subjectId }
        }),
        this.prisma.material.count({
          where: { 
            subjectId,
            isCompleted: true 
          }
        })
      ])

      return {
        total,
        completed,
        pending: total - completed
      }
    } catch (error) {
      console.error('Failed to get materials count:', error)
      throw new Error('Failed to get materials count')
    }
  }
}

export const materialService = new MaterialService()