"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isInitialized, setIsInitialized] = useState(false)
  const { data: session, status } = useSession()

  // Load theme from database when user is authenticated
  useEffect(() => {
    const loadThemeFromDatabase = async () => {
      try {
        // First, try localStorage for immediate initialization
        let storedTheme: Theme | null = null
        try {
          storedTheme = localStorage.getItem(storageKey) as Theme
        } catch (error) {
          console.log('🎨 ThemeProvider: localStorage not available, using default theme')
        }
        
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
          console.log('🎨 ThemeProvider: Loaded theme from localStorage:', storedTheme)
          setTheme(storedTheme)
        } else {
          console.log('🎨 ThemeProvider: No valid theme in localStorage, using default:', defaultTheme)
          setTheme(defaultTheme)
        }
        
        // Always initialize immediately
        setIsInitialized(true)

        // Then try to load from database if authenticated
        if (status === 'authenticated' && (session?.user as any)?.id) {
          try {
            console.log('🎨 ThemeProvider: Loading theme from database for user:', (session?.user as any)?.id)
            const response = await fetch('/api/user-settings')
            if (response.ok) {
              const userSettings = await response.json()
              if (userSettings?.theme && ['light', 'dark', 'system'].includes(userSettings.theme)) {
                console.log('🎨 ThemeProvider: Loaded theme from database:', userSettings.theme)
                setTheme(userSettings.theme)
                // Also update localStorage to keep them in sync
                try {
                  localStorage.setItem(storageKey, userSettings.theme)
                } catch (error) {
                  console.log('🎨 ThemeProvider: Could not save to localStorage:', error)
                }
              }
            }
          } catch (error) {
            console.error('🎨 ThemeProvider: Error loading theme from database:', error)
          }
        }
      } catch (error) {
        console.error('🎨 ThemeProvider: Error in loadThemeFromDatabase:', error)
        // Fallback: always initialize with default theme
        setTheme(defaultTheme)
        setIsInitialized(true)
      }
    }

    loadThemeFromDatabase()
    
    // Fallback timeout to ensure initialization
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.log('🎨 ThemeProvider: Timeout fallback - forcing initialization')
        setTheme(defaultTheme)
        setIsInitialized(true)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [status, (session?.user as any)?.id, storageKey, defaultTheme, isInitialized])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const saveThemeToDatabase = async (newTheme: Theme) => {
    if (status === 'authenticated' && (session?.user as any)?.id) {
      try {
        console.log('🎨 ThemeProvider: Saving theme to database:', newTheme)
        const response = await fetch('/api/user-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: (session?.user as any)?.id,
            theme: newTheme
          })
        })
        
        if (response.ok) {
          console.log('🎨 ThemeProvider: Theme saved to database successfully')
        } else {
          console.error('🎨 ThemeProvider: Failed to save theme to database')
        }
      } catch (error) {
        console.error('🎨 ThemeProvider: Error saving theme to database:', error)
      }
    }
  }

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      console.log('🎨 ThemeProvider: Setting theme to:', newTheme)
      // Update local state immediately
      setTheme(newTheme)
      // Save to localStorage
      localStorage.setItem(storageKey, newTheme)
      // Save to database if authenticated
      saveThemeToDatabase(newTheme)
    },
  }

  // Don't render until theme is initialized to prevent flash
  // Temporarily disabled loading screen to debug white screen issue
  // if (!isInitialized) {
  //   return (
  //     <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
  //       <div className="animate-pulse text-lg">Loading...</div>
  //     </div>
  //   )
  // }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
