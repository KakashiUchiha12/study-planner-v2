"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

// Add detailed logging for debugging
console.log('🔧 SessionProvider: Module loading at:', new Date().toISOString());
console.log('🔧 SessionProvider: Import paths:', {
  createContext: typeof createContext,
  useContext: typeof useContext,
  useEffect: typeof useEffect,
  useState: typeof useState
});

interface Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  expires: string
}

interface SessionContextType {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: (session?: Session | null) => Promise<Session | null>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
  session?: any
}

export function AuthSessionProvider({ children, session }: SessionProviderProps) {
  console.log('🔧 AuthSessionProvider: Component function called at:', new Date().toISOString());
  console.log('🔧 AuthSessionProvider: Props received:', { 
    hasChildren: !!children, 
    hasSession: !!session,
    childrenType: typeof children,
    sessionType: typeof session
  });

  const [isClient, setIsClient] = useState(false)
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  console.log('🔧 AuthSessionProvider: State initialized:', {
    isClient,
    hasSessionData: !!sessionData,
    status
  });

  useEffect(() => {
    console.log('🔧 AuthSessionProvider: useEffect triggered at:', new Date().toISOString());
    console.log('🔧 AuthSessionProvider: Starting client-side initialization')
    setIsClient(true)

    // Create a mock session that provides the same API as NextAuth
    const mockSession: Session = {
      user: {
        id: 'mock-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        image: null
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    console.log('🔧 AuthSessionProvider: Mock session created:', mockSession);
    setSessionData(mockSession)
    setStatus('authenticated')
    console.log('🔧 AuthSessionProvider: Mock session set successfully')
  }, [])

  const update = async (newSession?: Session | null): Promise<Session | null> => {
    if (newSession) {
      setSessionData(newSession)
      setStatus('authenticated')
    }
    return sessionData
  }

  const contextValue: SessionContextType = {
    data: sessionData,
    status,
    update
  }

  console.log('🔧 AuthSessionProvider: Render state:', {
    isClient,
    sessionProvided: !!session,
    hasSessionData: !!sessionData,
    status
  })

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

// Export a useSession hook that matches NextAuth's API
export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthSessionProvider')
  }
  return context
}
