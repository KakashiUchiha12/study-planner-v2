import { PrismaClient, Skill, SkillObjective } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateSkillData {
  name: string
  description: string
  resources?: string[]
}

export interface UpdateSkillData extends Partial<CreateSkillData> {
  // All fields are optional for updates - extends from CreateSkillData
  // This interface allows partial updates of skill data
  id?: string // Allow updating the skill ID if needed
}

export interface CreateSkillObjectiveData {
  title: string
  completed?: boolean
  description?: string
  targetDate?: Date
}

export interface UpdateSkillObjectiveData extends Partial<CreateSkillObjectiveData> {
  // All fields are optional for updates - extends from CreateSkillObjectiveData
  // This interface allows partial updates of skill objective data
  id?: string // Allow updating the objective ID if needed
}

export class SkillService {
  /**
   * Get all skills for a user
   */
  async getUserSkills(userId: string): Promise<Skill[]> {
    try {
      return await prisma.skill.findMany({
        where: { userId },
        include: {
          objectives: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching user skills:', error)
      throw new Error('Failed to fetch user skills')
    }
  }

  /**
   * Get skill by ID with objectives
   */
  async getSkillById(skillId: string): Promise<Skill | null> {
    try {
      return await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          objectives: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching skill:', error)
      throw new Error('Failed to fetch skill')
    }
  }

  /**
   * Create a new skill
   */
  async createSkill(userId: string, data: CreateSkillData): Promise<Skill> {
    try {
      // Shift all existing skills down by 1 to make room for new skill at top
      await prisma.skill.updateMany({
        where: { userId },
        data: {
          order: {
            increment: 1
          }
        }
      })

      // Create new skill with order 0 (top position)
      return await prisma.skill.create({
        data: {
          ...data,
          userId,
          order: 0,
          resources: typeof data.resources === 'string' ? data.resources : JSON.stringify(data.resources || [])
        },
        include: {
          objectives: true
        }
      })
    } catch (error) {
      console.error('Error creating skill:', error)
      throw new Error('Failed to create skill')
    }
  }

  /**
   * Update a skill
   */
  async updateSkill(skillId: string, data: UpdateSkillData): Promise<Skill> {
    try {
      const updateData: any = { ...data }
      if (data.resources) {
        // Check if resources is already a JSON string
        if (typeof data.resources === 'string') {
          updateData.resources = data.resources
        } else {
          updateData.resources = JSON.stringify(data.resources)
        }
      }

      return await prisma.skill.update({
        where: { id: skillId },
        data: updateData,
        include: {
          objectives: {
            orderBy: { order: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Error updating skill:', error)
      throw new Error('Failed to update skill')
    }
  }

  /**
   * Delete a skill
   */
  async deleteSkill(skillId: string): Promise<void> {
    try {
      await prisma.skill.delete({
        where: { id: skillId }
      })
    } catch (error) {
      console.error('Error deleting skill:', error)
      throw new Error('Failed to delete skill')
    }
  }

  /**
   * Reorder skills
   */
  async reorderSkills(userId: string, skillIds: string[]): Promise<void> {
    try {
      const updates = skillIds.map((skillId, index) => 
        prisma.skill.update({
          where: { id: skillId },
          data: { order: index }
        })
      )
      
      await prisma.$transaction(updates)
    } catch (error) {
      console.error('Error reordering skills:', error)
      throw new Error('Failed to reorder skills')
    }
  }

  /**
   * Add an objective to a skill
   */
  async addSkillObjective(skillId: string, data: CreateSkillObjectiveData): Promise<SkillObjective> {
    try {
      // Get the next order number for objectives
      const lastObjective = await prisma.skillObjective.findFirst({
        where: { skillId },
        orderBy: { order: 'desc' }
      })
      const nextOrder = (lastObjective?.order ?? -1) + 1

      return await prisma.skillObjective.create({
        data: {
          ...data,
          skillId,
          order: nextOrder
        }
      })
    } catch (error) {
      console.error('Error adding skill objective:', error)
      throw new Error('Failed to add skill objective')
    }
  }

  /**
   * Update a skill objective
   */
  async updateSkillObjective(objectiveId: string, data: UpdateSkillObjectiveData): Promise<SkillObjective> {
    try {
      return await prisma.skillObjective.update({
        where: { id: objectiveId },
        data
      })
    } catch (error) {
      console.error('Error updating skill objective:', error)
      throw new Error('Failed to update skill objective')
    }
  }

  /**
   * Toggle objective completion
   */
  async toggleSkillObjective(objectiveId: string): Promise<SkillObjective> {
    try {
      const objective = await prisma.skillObjective.findUnique({
        where: { id: objectiveId }
      })
      
      if (!objective) {
        throw new Error('Objective not found')
      }

      return await prisma.skillObjective.update({
        where: { id: objectiveId },
        data: { completed: !objective.completed }
      })
    } catch (error) {
      console.error('Error toggling skill objective:', error)
      throw new Error('Failed to toggle skill objective')
    }
  }

  /**
   * Delete a skill objective
   */
  async deleteSkillObjective(objectiveId: string): Promise<void> {
    try {
      await prisma.skillObjective.delete({
        where: { id: objectiveId }
      })
    } catch (error) {
      console.error('Error deleting skill objective:', error)
      throw new Error('Failed to delete skill objective')
    }
  }

  /**
   * Reorder objectives within a skill
   */
  async reorderSkillObjectives(skillId: string, objectiveIds: string[]): Promise<void> {
    try {
      const updates = objectiveIds.map((objectiveId, index) => 
        prisma.skillObjective.update({
          where: { id: objectiveId },
          data: { order: index }
        })
      )
      
      await prisma.$transaction(updates)
    } catch (error) {
      console.error('Error reordering skill objectives:', error)
      throw new Error('Failed to reorder skill objectives')
    }
  }

  /**
   * Calculate skill level based on completed objectives
   */
  async calculateSkillLevel(skillId: string): Promise<number> {
    try {
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
        include: { objectives: true }
      })

      if (!skill || skill.objectives.length === 0) {
        return skill?.currentLevel || 1
      }

      const completedObjectives = skill.objectives.filter(obj => obj.completed).length
      const calculatedLevel = Math.min(
        10, 
        Math.round((completedObjectives / skill.objectives.length) * skill.targetLevel)
      )
      
      // Update the skill level
      await prisma.skill.update({
        where: { id: skillId },
        data: { currentLevel: calculatedLevel }
      })

      return calculatedLevel
    } catch (error) {
      console.error('Error calculating skill level:', error)
      throw new Error('Failed to calculate skill level')
    }
  }

  /**
   * Get skills with parsed resources
   */
  async getUserSkillsWithParsedResources(userId: string): Promise<(Skill & { parsedResources: string[] })[]> {
    try {
      const skills = await this.getUserSkills(userId)
      
      return skills.map(skill => ({
        ...skill,
        parsedResources: JSON.parse(skill.resources || '[]')
      }))
    } catch (error) {
      console.error('Error parsing skill resources:', error)
      throw new Error('Failed to parse skill resources')
    }
  }
}

export const skillService = new SkillService()
