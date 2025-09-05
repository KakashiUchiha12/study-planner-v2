import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'
import { Skill, SkillObjective } from '@prisma/client'

interface UseSkillsReturn {
  skills: Skill[]
  loading: boolean
  error: string | null
  createSkill: (data: any) => Promise<void>
  updateSkill: (skillId: string, data: any) => Promise<void>
  deleteSkill: (skillId: string) => Promise<void>
  addSkillObjective: (skillId: string, objective: Omit<SkillObjective, 'id' | 'skillId' | 'createdAt' | 'updatedAt'>) => Promise<SkillObjective>
  updateSkillObjective: (skillId: string, objectiveId: string, updates: Partial<SkillObjective>) => Promise<SkillObjective>
  toggleSkillObjective: (objectiveId: string) => Promise<void>
  deleteSkillObjective: (skillId: string, objectiveId: string) => Promise<void>
  reorderSkills: (skillIds: string[]) => Promise<void>
  reorderSkillObjectives: (skillId: string, objectiveIds: string[]) => Promise<void>
  refreshSkills: () => Promise<void>
}

export const useSkills = () => {
  const { data: session, status } = useSession()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSkills = useCallback(async () => {
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/skills')
      if (!response.ok) {
        throw new Error('Failed to fetch skills')
      }
      const data = await response.json()
      setSkills(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch skills')
    } finally {
      setLoading(false)
    }
  }, [(session?.user as any)?.id, status])

  const createSkill = useCallback(async (data: any) => {
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
      throw new Error('Authentication required. Please log in.')
    }

    try {
      setError(null)
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create skill')
      }

      const newSkill = await response.json()
      setSkills(prev => [...prev, newSkill])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create skill')
      throw err
    }
  }, [status, (session?.user as any)?.id])

  const updateSkill = useCallback(async (skillId: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({ id: skillId, ...data }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedSkill = await response.json()
      console.log('Updated skill from API:', updatedSkill);
      console.log('Updated skill resources:', updatedSkill.resources);
      setSkills(prev => prev.map(skill => 
        skill.id === skillId ? updatedSkill : skill
      ))
    } catch (err) {
      console.error('Error updating skill:', err)
      setError(err instanceof Error ? err.message : 'Failed to update skill')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSkill = useCallback(async (skillId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/skills?id=${skillId}`, {
        method: 'DELETE',
        credentials: 'include', // Include session cookies
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setSkills(prev => prev.filter(skill => skill.id !== skillId))
    } catch (err) {
      console.error('Error deleting skill:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete skill')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addSkillObjective = useCallback(async (skillId: string, objective: Omit<SkillObjective, 'id' | 'skillId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const response = await fetch(`/api/skills/${skillId}/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objective)
      })

      if (!response.ok) {
        throw new Error('Failed to add objective to skill')
      }

      const newObjective = await response.json()
      
      setSkills(prevSkills => 
        prevSkills.map(skill => 
          skill.id === skillId 
            ? { ...skill, objectives: [...(skill as any).objectives || [], newObjective] }
            : skill
        )
      )

      return newObjective
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add objective to skill')
      throw err
    }
  }, [])

  const updateSkillObjective = useCallback(async (skillId: string, objectiveId: string, updates: Partial<SkillObjective>) => {
    try {
      setError(null)
      const response = await fetch(`/api/skills/${skillId}/objectives/${objectiveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update objective')
      }

      const updatedObjective = await response.json()
      
      setSkills(prevSkills => 
        prevSkills.map(s => 
          s.id === skillId 
            ? { ...s, objectives: (s as any).objectives?.map((o: any) => o.id === objectiveId ? updatedObjective : o) || [] }
            : s
        )
      )

      return updatedObjective
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update objective')
      throw err
    }
  }, [])

  const toggleSkillObjective = useCallback(async (objectiveId: string) => {
    try {
      setError(null)
      // Find the skill that contains this objective
      const skill = skills.find(s => (s as any).objectives?.some((o: any) => o.id === objectiveId))
      if (!skill) {
        throw new Error('Skill not found for objective')
      }

      const objective = (skill as any).objectives?.find((o: any) => o.id === objectiveId)
      if (!objective) {
        throw new Error('Objective not found')
      }

      const response = await fetch(`/api/skills/${skill.id}/objectives/${objectiveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle objective')
      }

      const updatedObjective = await response.json()
      
      setSkills(prevSkills => 
        prevSkills.map(s => 
          s.id === skill.id 
            ? { ...s, objectives: (s as any).objectives?.map((o: any) => o.id === objectiveId ? updatedObjective : o) || [] }
            : s
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle objective')
      throw err
    }
  }, [skills])

  const deleteSkillObjective = useCallback(async (skillId: string, objectiveId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/skills/${skillId}/objectives/${objectiveId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete objective')
      }

      setSkills(prevSkills => 
        prevSkills.map(s => 
          s.id === skillId 
            ? { ...s, objectives: (s as any).objectives?.filter((o: any) => o.id !== objectiveId) || [] }
            : s
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete objective')
      throw err
    }
  }, [])

  const reorderSkills = useCallback(async (skillIds: string[]) => {
    try {
      setLoading(true)
      setError(null)
      
      // Optimistically update the UI
      const reorderedSkills = skillIds.map(id => skills.find(s => s.id === id)).filter(Boolean) as Skill[]
      setSkills(reorderedSkills)
      
      // Call the reorder API endpoint
      const response = await fetch('/api/skills/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update with the actual data from the server
      const updatedSkills = await response.json()
      setSkills(updatedSkills)
    } catch (err) {
      console.error('Error reordering skills:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder skills')
      // Revert optimistic update
      await fetchSkills()
    } finally {
      setLoading(false)
    }
  }, [skills, fetchSkills])

  const reorderSkillObjectives = useCallback(async (skillId: string, objectiveIds: string[]) => {
    try {
      setError(null)
      const response = await fetch(`/api/skills/${skillId}/objectives/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveIds })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder objectives')
      }

      const skill = skills.find(s => s.id === skillId)
      if (skill) {
        const reorderedObjectives = objectiveIds.map(id => (skill as any).objectives?.find((o: any) => o.id === id)).filter(Boolean) as SkillObjective[]
        
        setSkills(prevSkills => 
          prevSkills.map(s => 
            s.id === skillId 
              ? { ...s, objectives: reorderedObjectives }
              : s
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder objectives')
      throw err
    }
  }, [skills])

  const refreshSkills = useCallback(async () => {
    await fetchSkills()
  }, [fetchSkills])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  return {
    skills,
    loading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
    addSkillObjective,
    updateSkillObjective,
    toggleSkillObjective,
    deleteSkillObjective,
    reorderSkills,
    reorderSkillObjectives,
    refreshSkills,
  }
}
