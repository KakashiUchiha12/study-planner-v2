import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'

export interface UserSettings {
  id: string
  userId: string
  theme: string
  taskReminders: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  reminderTime: string
  studySessionAlerts: boolean
  defaultStudyGoal: number
  preferredStudyTime: string
  breakReminders: boolean
  breakDuration: number
  studyStreakTracking: boolean
  dataRetentionDays: number
  dashboardLayout: string
  showProgressBars: boolean
  compactMode: boolean
  autoBackup: boolean
  createdAt: Date
  updatedAt: Date
}

const defaultSettings: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'light',
  taskReminders: true,
  emailNotifications: false,
  pushNotifications: true,
  reminderTime: '09:00',
  studySessionAlerts: true,
  defaultStudyGoal: 60,
  preferredStudyTime: 'morning',
  breakReminders: true,
  breakDuration: 15,
  studyStreakTracking: true,
  dataRetentionDays: 365,
  dashboardLayout: 'default',
  showProgressBars: true,
  compactMode: false,
  autoBackup: true
}

export const useUserSettings = () => {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!(session?.user as any)?.id) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔧 loadSettings: Starting to load settings for user:', (session?.user as any)?.id)
      
      const response = await fetch('/api/user-settings')
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      console.error('Error loading settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [(session?.user as any)?.id])

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!(session?.user as any)?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          ...newSettings
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      throw err
    }
  }, [(session?.user as any)?.id])

  // Update a single setting
  const updateSetting = useCallback(async (key: keyof Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, value: any) => {
    if (!(session?.user as any)?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          [key]: value
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting')
      throw err
    }
  }, [(session?.user as any)?.id])

  // Load settings when session changes
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.id) {
      loadSettings()
    }
  }, [(session?.user as any)?.id, loadSettings])

  // Get current setting value with fallback to default
  const getSetting = useCallback(<K extends keyof Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(key: K): any => {
    const value = settings ? (settings[key] ?? defaultSettings[key]) : defaultSettings[key]
    console.log('🔧 useUserSettings getSetting:', { 
      key, 
      value, 
      hasSettings: !!settings,
      defaultValue: defaultSettings[key]
    })
    return value
  }, [settings])

  // Get boolean setting with fallback
  const isSettingEnabled = useCallback((key: keyof Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): boolean => {
    return getSetting(key) as boolean
  }, [getSetting])

  const getSettingWithFallback = useCallback(<K extends keyof Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(key: K, fallbackValue: any): any => {
    const value = settings ? (settings[key] ?? fallbackValue) : fallbackValue
    return value
  }, [settings])

  const resetToDefaults = useCallback(async () => {
    if ((session?.user as any)?.id) {
      console.log('🔧 Loading settings for user:', (session?.user as any)?.id)
      await loadSettings()
    }
  }, [(session?.user as any)?.id, loadSettings])

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSetting,
    getSetting,
    isSettingEnabled,
    defaultSettings,
    getSettingWithFallback,
    resetToDefaults
  }
}
