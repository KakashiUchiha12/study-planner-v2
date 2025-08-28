import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface UserSettings {
  id?: string
  userId: string
  taskReminders: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  reminderTime: string
  studySessionAlerts: boolean
  defaultStudyGoal: number
  preferredStudyTime: string
  breakReminders: boolean
  breakDuration: number
  theme: string
  dashboardLayout: string
  showProgressBars: boolean
  compactMode: boolean
  autoBackup: boolean
  dataRetentionDays: number
  createdAt?: Date
  updatedAt?: Date
}

const defaultSettings: Omit<UserSettings, 'userId'> = {
  taskReminders: true,
  emailNotifications: false,
  pushNotifications: true,
  reminderTime: "09:00",
  studySessionAlerts: true,
  defaultStudyGoal: 240,
  preferredStudyTime: "18:00",
  breakReminders: true,
  breakDuration: 15,
  theme: "system",
  dashboardLayout: "default",
  showProgressBars: true,
  compactMode: false,
  autoBackup: true,
  dataRetentionDays: 365
}

export function useUserSettings() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('🔧 loadSettings: No user ID, skipping')
      setLoading(false)
      return
    }

    try {
      console.log('🔧 loadSettings: Starting to load settings for user:', session.user.id)
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user-settings')
      console.log('🔧 loadSettings: API response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔧 loadSettings: Settings loaded successfully:', data)
        setSettings(data)
      } else {
        const errorText = await response.text()
        console.error('🔧 loadSettings: API error response:', errorText)
        throw new Error(`Failed to load settings: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('🔧 loadSettings: Error occurred:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      
      // Fallback to default settings
      console.log('🔧 loadSettings: Falling back to default settings')
      setSettings({
        userId: session.user.id,
        ...defaultSettings
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      console.log('🔧 saveSettings: Saving settings', { newSettings, currentSettings: settings })
      setError(null)

      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          ...newSettings,
          userId: session.user.id
        })
      })

      console.log('🔧 saveSettings: API response', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔧 saveSettings: Settings saved successfully', data)
        setSettings(data)
        return data
      } else {
        const errorText = await response.text()
        console.error('🔧 saveSettings: API error response', errorText)
        throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('🔧 saveSettings: Error occurred', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      throw err
    }
  }, [session?.user?.id, settings])

  // Update a single setting
  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!settings) return

    try {
      console.log('🔧 updateSetting: Updating setting', { key, value, currentSettings: settings })
      
      // Update local state immediately
      const updatedSettings = { ...settings, [key]: value }
      setSettings(updatedSettings)
      
      // Save to database
      await saveSettings({ [key]: value })
      
      console.log('🔧 updateSetting: Setting updated successfully', { key, value })
    } catch (err) {
      console.error(`🔧 updateSetting: Error updating setting ${key}:`, err)
      // Revert local state on error
      setSettings(settings)
      throw err
    }
  }, [settings, saveSettings])

  // Load settings when session changes
  useEffect(() => {
    console.log('🔧 useUserSettings session changed:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      sessionData: session 
    })
    
    if (session?.user?.id) {
      console.log('🔧 Loading settings for user:', session.user.id)
      loadSettings()
    } else {
      console.log('🔧 No session, clearing settings')
      setSettings(null)
      setLoading(false)
    }
  }, [session?.user?.id, loadSettings])

  // Get current setting value with fallback to default
  const getSetting = useCallback(<K extends keyof UserSettings>(
    key: K
  ): UserSettings[K] => {
    const value = settings ? (settings[key] ?? defaultSettings[key]) : defaultSettings[key]
    console.log('🔧 useUserSettings getSetting:', { 
      key, 
      value, 
      settingsLoaded: !!settings,
      hasSettings: !!settings,
      fallbackValue: defaultSettings[key]
    })
    return value
  }, [settings])

  // Check if a setting is enabled
  const isSettingEnabled = useCallback((key: keyof Pick<UserSettings, 
    'taskReminders' | 'emailNotifications' | 'pushNotifications' | 
    'studySessionAlerts' | 'breakReminders' | 'showProgressBars' | 
    'compactMode' | 'autoBackup'
  >): boolean => {
    return getSetting(key) as boolean
  }, [getSetting])

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSetting,
    getSetting,
    isSettingEnabled,
    defaultSettings
  }
}
