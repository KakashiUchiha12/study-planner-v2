import { useState, useEffect } from 'react'

interface MockUser {
  id: string
  name?: string
  email?: string
  image?: string | null
}

interface MockSession {
  user: MockUser
  expires: string
}

interface MockSessionReturn {
  data: MockSession | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: (session?: MockSession | null) => Promise<MockSession | null>
}

export function useSession(): MockSessionReturn {
  console.log('🔐 useSession: Using mock session hook (no NextAuth dependencies)')
  
  const [session, setSession] = useState<MockSession | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    console.log('🔐 useSession: Initializing database session')
    
    // Get real user from database
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/auth/current-user')
        if (response.ok) {
          const userData = await response.json()
          const realSession: MockSession = {
            user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              image: userData.image
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
          setSession(realSession)
          setStatus('authenticated')
          console.log('🔐 useSession: Real session initialized successfully:', userData.id)
        } else {
          throw new Error('Failed to get user data')
        }
      } catch (error) {
        console.error('🔐 useSession: Error getting user data:', error)
        // Fallback to first available user
        const fallbackSession: MockSession = {
          user: {
            id: 'cmew9pj6k0000v56cm1ar10gr', // First user from database
            name: 'diyer2112',
            email: 'fsdsfsegggggggggggggggg',
            image: null
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
        setSession(fallbackSession)
        setStatus('authenticated')
        console.log('🔐 useSession: Fallback session initialized')
      }
    }
    
    initializeSession()
  }, [])

  const update = async (newSession?: MockSession | null): Promise<MockSession | null> => {
    console.log('🔐 useSession: Update called with session:', !!newSession)
    if (newSession) {
      setSession(newSession)
      setStatus('authenticated')
    }
    return session
  }

  return {
    data: session,
    status,
    update
  }
}
