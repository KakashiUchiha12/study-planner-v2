import { useState, useCallback, useEffect } from 'react'
import { useSession } from './use-session-simple'
import { Material, CreateMaterialData, UpdateMaterialData } from '@/lib/database'
import { notifyDataUpdate } from '@/lib/data-sync'
import { useRouter } from 'next/navigation'

export function useMaterials(chapterId?: string, subjectId?: string) {
  const { data: session, status } = useSession()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Get user ID from session
  const userId = (session?.user as any)?.id

  // Load materials from API
  const loadMaterials = useCallback(async () => {
    if (!userId || (!chapterId && !subjectId)) {
      throw new Error('User not authenticated or chapter/subject ID not provided')
    }

    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/materials?'
      if (chapterId) {
        url += `chapterId=${chapterId}`
      } else {
        url += `subjectId=${subjectId}`
      }
      
      const response = await fetch(url)
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.status}`)
      }
      
      const data = await response.json()
      setMaterials(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load materials'
      setError(errorMessage)
      console.error('Failed to load materials:', err)
      
      // Handle redirect on 401 error
      if (errorMessage === 'Authentication required. Please log in.') {
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, chapterId, subjectId, router])

  // Create a new material
  const createMaterial = useCallback(async (materialData: CreateMaterialData) => {
    console.log('[useMaterials] createMaterial called with:', { materialData, userId })
    
    if (!userId) {
      console.error('[useMaterials] No userId available for material creation')
      throw new Error('User authentication required')
    }

    try {
      console.log('[useMaterials] Sending POST request to /api/materials')
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      })

      console.log('[useMaterials] Response status:', response.status)
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[useMaterials] Server error:', errorData)
        throw new Error(errorData.error || 'Server error. Please try again later.')
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[useMaterials] Request failed:', errorData)
        throw new Error(errorData.error || 'Failed to create material')
      }

      const newMaterial = await response.json()
      setMaterials(prev => [...prev, newMaterial])
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return newMaterial
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create material'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing material
  const updateMaterial = useCallback(async (materialId: string, updates: UpdateMaterialData) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to update material')
      }

      const updatedMaterial = await response.json()
      setMaterials(prev => prev.map(material => 
        material.id === materialId ? updatedMaterial : material
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return updatedMaterial
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update material'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a material
  const deleteMaterial = useCallback(async (materialId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to delete material')
      }

      setMaterials(prev => prev.filter(material => material.id !== materialId))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete material'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Toggle material completion
  const toggleMaterialCompletion = useCallback(async (materialId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/materials/${materialId}/toggle`, {
        method: 'PUT',
      })

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (!response.ok) {
        throw new Error('Failed to toggle material completion')
      }

      const updatedMaterial = await response.json()
      setMaterials(prev => prev.map(material => 
        material.id === materialId ? updatedMaterial : material
      ))
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      return updatedMaterial
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle material completion'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Reorder materials within a chapter or subject
  const reorderMaterials = useCallback(async (materialOrders: { id: string; order: number }[]) => {
    if (!userId || (!chapterId && !subjectId)) return

    try {
      console.log('[useMaterials] Reordering materials:', materialOrders)
      
      // Update local state immediately for better UX
      const updatedMaterials = materials.map(material => {
        const newOrder = materialOrders.find(mo => mo.id === material.id)
        return newOrder ? { ...material, order: newOrder.order } : material
      }).sort((a, b) => a.order - b.order)
      
      setMaterials(updatedMaterials)

      // Determine the chapterId from the materials being reordered
      let targetChapterId = chapterId
      if (!targetChapterId && materials.length > 0) {
        // Find the chapterId from the first material being reordered
        const firstMaterialId = materialOrders[0]?.id
        const firstMaterial = materials.find(m => m.id === firstMaterialId)
        if (firstMaterial) {
          targetChapterId = firstMaterial.chapterId || undefined
          console.log(`[useMaterials] Extracted chapterId from material: ${targetChapterId}`)
        }
      }

      // Use the service method for proper reordering
      if (targetChapterId) {
        console.log(`[useMaterials] Using reorder API for chapter: ${targetChapterId}`)
        const response = await fetch('/api/materials/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chapterId: targetChapterId,
            materialOrders
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to reorder materials')
        }
      } else {
        console.log('[useMaterials] No chapterId available, skipping reorder')
        // If no chapterId available, just update local state
        // The reordering will be handled by the UI state
      }
      
      console.log('[useMaterials] Materials reordered successfully')
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
    } catch (err) {
      console.error('[useMaterials] Failed to reorder materials:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder materials'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, chapterId, subjectId, materials, updateMaterial])

  // Get materials by type
  const getMaterialsByType = useCallback(async (type: string) => {
    if (!userId || !subjectId) return []

    try {
      const response = await fetch(`/api/materials?subjectId=${subjectId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }
      
      const allMaterials = await response.json()
      return allMaterials.filter((material: Material) => material.type === type)
    } catch (err) {
      console.error('Failed to get materials by type:', err)
      return []
    }
  }, [userId, subjectId])

  // Load materials on mount and when chapterId/subjectId changes
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session
      return
    }
    
    if (userId && (chapterId || subjectId)) {
      loadMaterials()
    } else {
      // If no user ID or chapter/subject ID, clear materials and set loading to false
      setMaterials([])
      setLoading(false)
    }
  }, [userId, chapterId, subjectId, status]) // Remove loadMaterials from dependencies to prevent infinite loops

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleMaterialCompletion,
    reorderMaterials,
    getMaterialsByType,
    refreshMaterials: loadMaterials
  }
}
