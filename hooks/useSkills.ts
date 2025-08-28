import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Skill, SkillObjective, CreateSkillData, UpdateSkillData, CreateSkillObjectiveData, UpdateSkillObjectiveData } from '@/lib/database'

interface UseSkillsReturn {
  skills: Skill[]
  loading: boolean
  error: string | null
  createSkill: (data: CreateSkillData) => Promise<void>
  updateSkill: (skillId: string, data: UpdateSkillData) => Promise<void>
  deleteSkill: (skillId: string) => Promise<void>
  addSkillObjective: (skillId: string, data: CreateSkillObjectiveData) => Promise<void>
  updateSkillObjective: (objectiveId: string, data: UpdateSkillObjectiveData) => Promise<void>
  toggleSkillObjective: (objectiveId: string) => Promise<void>
  deleteSkillObjective: (objectiveId: string) => Promise<void>
  reorderSkills: (skillIds: string[]) => Promise<void>
  reorderSkillObjectives: (skillId: string, objectiveIds: string[]) => Promise<void>
  refreshSkills: () => Promise<void>
}

export function useSkills(): UseSkillsReturn {
  const { data: session, status } = useSession()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSkills = useCallback(async () => {
    // Only fetch if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/skills', {
        credentials: 'include' // Include session cookies
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setSkills(data)
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch skills')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const createSkill = useCallback(async (data: CreateSkillData) => {
    // Only create if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newSkill = await response.json()
      setSkills(prev => [newSkill, ...prev])
    } catch (err) {
      console.error('Error creating skill:', err)
      setError(err instanceof Error ? err.message : 'Failed to create skill')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const updateSkill = useCallback(async (skillId: string, data: UpdateSkillData) => {
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

  const addSkillObjective = useCallback(async (skillId: string, data: CreateSkillObjectiveData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/skills/${skillId}/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newObjective = await response.json()
      setSkills(prev => prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, objectives: [...skill.objectives, newObjective] }
          : skill
      ))
    } catch (err) {
      console.error('Error adding skill objective:', err)
      setError(err instanceof Error ? err.message : 'Failed to add skill objective')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSkillObjective = useCallback(async (objectiveId: string, data: UpdateSkillObjectiveData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the skill that contains this objective
      const skill = skills.find(s => s.objectives.some(o => o.id === objectiveId))
      if (!skill) {
        throw new Error('Skill not found for objective')
      }
      
      const response = await fetch(`/api/skills/${skill.id}/objectives/${objectiveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedObjective = await response.json()
      setSkills(prev => prev.map(s => 
        s.id === skill.id 
          ? { ...s, objectives: s.objectives.map(o => o.id === objectiveId ? updatedObjective : o) }
          : s
      ))
    } catch (err) {
      console.error('Error updating skill objective:', err)
      setError(err instanceof Error ? err.message : 'Failed to update skill objective')
      throw err
    } finally {
      setLoading(false)
    }
  }, [skills])

  const toggleSkillObjective = useCallback(async (objectiveId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the skill that contains this objective
      const skill = skills.find(s => s.objectives.some(o => o.id === objectiveId))
      if (!skill) {
        throw new Error('Skill not found for objective')
      }
      
      const objective = skill.objectives.find(o => o.id === objectiveId)
      if (!objective) {
        throw new Error('Objective not found')
      }
      
      const response = await fetch(`/api/skills/${skill.id}/objectives/${objectiveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !objective.completed }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedObjective = await response.json()
      setSkills(prev => prev.map(s => 
        s.id === skill.id 
          ? { ...s, objectives: s.objectives.map(o => o.id === objectiveId ? updatedObjective : o) }
          : s
      ))
    } catch (err) {
      console.error('Error toggling skill objective:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle skill objective')
      throw err
    } finally {
      setLoading(false)
    }
  }, [skills])

  const deleteSkillObjective = useCallback(async (objectiveId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Find the skill that contains this objective
      const skill = skills.find(s => s.objectives.some(o => o.id === objectiveId))
      if (!skill) {
        throw new Error('Skill not found for objective')
      }
      
      const response = await fetch(`/api/skills/${skill.id}/objectives/${objectiveId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setSkills(prev => prev.map(s => 
        s.id === skill.id 
          ? { ...s, objectives: s.objectives.filter(o => o.id !== objectiveId) }
          : s
      ))
    } catch (err) {
      console.error('Error deleting skill objective:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete skill objective')
      throw err
    } finally {
      setLoading(false)
    }
  }, [skills])

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
      setLoading(true)
      setError(null)
      
      const skill = skills.find(s => s.id === skillId)
      if (!skill) {
        throw new Error('Skill not found')
      }
      
      // Optimistically update the UI
      const reorderedObjectives = objectiveIds.map(id => skill.objectives.find(o => o.id === id)).filter(Boolean) as SkillObjective[]
      setSkills(prev => prev.map(s => 
        s.id === skillId ? { ...s, objectives: reorderedObjectives } : s
      ))
      
      // TODO: Implement reorder API call when endpoint is available
      // const response = await fetch(`/api/skills/${skillId}/objectives/reorder`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ objectiveIds }),
      // })
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`)
      // }
    } catch (err) {
      console.error('Error reordering skill objectives:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder skill objectives')
      // Revert optimistic update
      await fetchSkills()
    } finally {
      setLoading(false)
    }
  }, [skills, fetchSkills])

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
