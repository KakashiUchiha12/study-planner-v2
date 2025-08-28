import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { UserProfile, CreateProfileData, UpdateProfileData } from '@/lib/database'

interface UseProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  createProfile: (data: CreateProfileData) => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  deleteProfile: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    // Only fetch if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile', {
        credentials: 'include' // Include session cookies
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // Profile doesn't exist yet, which is fine
          setProfile(null)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const createProfile = useCallback(async (data: CreateProfileData) => {
    // Only create if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile', {
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
      
      const newProfile = await response.json()
      setProfile(newProfile)
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    // Only update if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const deleteProfile = useCallback(async () => {
    // Only delete if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        credentials: 'include', // Include session cookies
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setProfile(null)
    } catch (err) {
      console.error('Error deleting profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete profile')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    refreshProfile,
  }
}
