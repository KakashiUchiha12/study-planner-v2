"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useUserSettings } from "@/hooks/useUserSettings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TimePicker } from "@/components/ui/time-picker"
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Target, 
  Database, 
  Download, 
  Upload,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

// Legacy interface for backward compatibility
interface LegacyUserSettings {
  studyGoals: {
    dailyHours: number
    weeklyHours: number
    monthlyHours: number
    autoCalculate: boolean
  }
  notifications: {
    taskReminders: boolean
    studySessionAlerts: boolean
    emailNotifications: boolean
    pushNotifications: boolean
    reminderTime: string
  }
  dataManagement: {
    autoBackup: boolean
    backupFrequency: string
    exportFormat: string
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Use the new database-backed settings hook
  const { 
    settings: dbSettings, 
    loading: settingsLoading, 
    error: settingsError,
    updateSetting, 
    saveSettings 
  } = useUserSettings()

  // Local state for UI display
  const [localSettings, setLocalSettings] = useState<LegacyUserSettings>({
    studyGoals: {
      dailyHours: 4,
      weeklyHours: 28,
      monthlyHours: 120,
      autoCalculate: true
    },
    notifications: {
      taskReminders: true,
      studySessionAlerts: true,
      emailNotifications: false,
      pushNotifications: true,
      reminderTime: "09:00"
    },
    dataManagement: {
      autoBackup: true,
      backupFrequency: "weekly",
      exportFormat: "json"
    }
  })

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
  }, [router, status])

  // Sync local settings with database settings when they load
  useEffect(() => {
    if (dbSettings) {
      console.log('Database settings loaded, syncing with local format:', dbSettings)
      
      // Convert database settings to local format for display
      const convertedSettings: LegacyUserSettings = {
        studyGoals: {
          dailyHours: Math.round((dbSettings.defaultStudyGoal || 240) / 60), // Convert minutes to hours
          weeklyHours: Math.round(((dbSettings.defaultStudyGoal || 240) / 60) * 7),
          monthlyHours: Math.round(((dbSettings.defaultStudyGoal || 240) / 60) * 30),
          autoCalculate: false
        },
        notifications: {
          taskReminders: dbSettings.taskReminders,
          studySessionAlerts: dbSettings.studySessionAlerts,
          emailNotifications: dbSettings.emailNotifications,
          pushNotifications: dbSettings.pushNotifications,
          reminderTime: dbSettings.reminderTime
        },
        dataManagement: {
          autoBackup: dbSettings.autoBackup,
          backupFrequency: "weekly", // Default value
          exportFormat: "json" // Default value
        }
      }
      
      setLocalSettings(convertedSettings)
    }
  }, [dbSettings])

  // Keep weekly and monthly goals in sync when autoCalculate is enabled
  useEffect(() => {
    if (localSettings.studyGoals.autoCalculate) {
      const expectedWeekly = localSettings.studyGoals.dailyHours * 7
      const expectedMonthly = localSettings.studyGoals.dailyHours * 30
      
      if (localSettings.studyGoals.weeklyHours !== expectedWeekly || 
          localSettings.studyGoals.monthlyHours !== expectedMonthly) {
        console.log('Auto-calculating weekly and monthly goals to match daily goal')
        saveSettingsToDatabase({
          studyGoals: {
            ...localSettings.studyGoals,
            weeklyHours: expectedWeekly,
            monthlyHours: expectedMonthly
          }
        })
      }
    }
  }, [localSettings.studyGoals.dailyHours, localSettings.studyGoals.autoCalculate])

  const saveSettingsToDatabase = async (newSettings: Partial<LegacyUserSettings>) => {
    const updatedLocalSettings = { ...localSettings, ...newSettings }
    console.log('Saving settings to database:', updatedLocalSettings)
    
    // Update local state immediately for better UX
    setLocalSettings(updatedLocalSettings)
    
    // Save to database
    if (dbSettings) {
      try {
        const dbUpdates: any = {}
        
        // Convert local format to database format
        if (newSettings.studyGoals?.dailyHours !== undefined) {
          dbUpdates.defaultStudyGoal = newSettings.studyGoals.dailyHours * 60 // Convert hours to minutes
        }
        
        if (newSettings.notifications?.taskReminders !== undefined) {
          dbUpdates.taskReminders = newSettings.notifications.taskReminders
        }
        
        if (newSettings.notifications?.studySessionAlerts !== undefined) {
          dbUpdates.studySessionAlerts = newSettings.notifications.studySessionAlerts
        }
        
        if (newSettings.notifications?.emailNotifications !== undefined) {
          dbUpdates.emailNotifications = newSettings.notifications.emailNotifications
        }
        
        if (newSettings.notifications?.pushNotifications !== undefined) {
          dbUpdates.pushNotifications = newSettings.notifications.pushNotifications
        }
        
        if (newSettings.notifications?.reminderTime !== undefined) {
          dbUpdates.reminderTime = newSettings.notifications.reminderTime
        }
        
        if (newSettings.dataManagement?.autoBackup !== undefined) {
          dbUpdates.autoBackup = newSettings.dataManagement.autoBackup
        }
        
        if (Object.keys(dbUpdates).length > 0) {
          console.log('Updating database with:', dbUpdates)
          await saveSettings(dbUpdates)
          console.log('Database updated successfully')
        }
      } catch (error) {
        console.error('Failed to update database:', error)
        // Revert local state on error
        setLocalSettings(localSettings)
        throw error
      }
    }
    
    console.log('Settings saved successfully to database')
  }

  const exportData = () => {
    const data = {
      studySessions: JSON.parse(localStorage.getItem("studySessions") || "[]"),
      tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
      subjects: JSON.parse(localStorage.getItem("subjects") || "[]"),
      testMarks: JSON.parse(localStorage.getItem("testMarks") || "[]"),
      settings: localSettings
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `study-planner-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // Import data to localStorage
        if (data.studySessions) localStorage.setItem("studySessions", JSON.stringify(data.studySessions))
        if (data.tasks) localStorage.setItem("tasks", JSON.stringify(data.tasks))
        if (data.subjects) localStorage.setItem("subjects", JSON.stringify(data.subjects))
        if (data.testMarks) localStorage.setItem("testMarks", JSON.stringify(data.testMarks))
                 if (data.settings) {
           setLocalSettings(data.settings)
           // Save imported settings to database
           saveSettingsToDatabase(data.settings)
         }
        
        alert("Data imported successfully!")
      } catch (error) {
        alert("Failed to import data. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  if (status === "loading" || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (settingsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
          <p className="text-muted-foreground mb-4">{settingsError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Settings</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Settings & Preferences</h1>
          <p className="text-muted-foreground">Customize your study planner experience</p>
        </div>

        {/* Study Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Study Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyHours">Daily Goal (hours)</Label>
                <Input
                  id="dailyHours"
                  type="number"
                  min="0"
                  step="0.5"
                                     value={localSettings.studyGoals.dailyHours}
                  onChange={(e) => {
                    const newDailyHours = parseFloat(e.target.value) || 0
                    const newSettings = {
                      studyGoals: {
                        ...localSettings.studyGoals,
                        dailyHours: newDailyHours
                      }
                    }
                    
                    // If autoCalculate is enabled, also update weekly and monthly
                    if (localSettings.studyGoals.autoCalculate) {
                      newSettings.studyGoals.weeklyHours = newDailyHours * 7
                      newSettings.studyGoals.monthlyHours = newDailyHours * 30
                    }
                    
                    saveSettingsToDatabase(newSettings)
                  }}
                  disabled={localSettings.studyGoals.autoCalculate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Weekly Goal (hours)</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={localSettings.studyGoals.weeklyHours}
                  onChange={(e) => saveSettingsToDatabase({
                    studyGoals: {
                      ...localSettings.studyGoals,
                      weeklyHours: parseFloat(e.target.value) || 0
                    }
                  })}
                  disabled={localSettings.studyGoals.autoCalculate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyHours">Monthly Goal (hours)</Label>
                <Input
                  id="monthlyHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={localSettings.studyGoals.monthlyHours}
                  onChange={(e) => saveSettingsToDatabase({
                    studyGoals: {
                      ...localSettings.studyGoals,
                      monthlyHours: parseFloat(e.target.value) || 0
                    }
                  })}
                  disabled={localSettings.studyGoals.autoCalculate}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoCalculate"
                checked={localSettings.studyGoals.autoCalculate}
                onCheckedChange={(checked) => {
                  const newSettings = {
                    studyGoals: {
                      ...localSettings.studyGoals,
                      autoCalculate: checked
                    }
                  }
                  
                  // If enabling autoCalculate, update weekly and monthly values
                  if (checked) {
                    newSettings.studyGoals.weeklyHours = localSettings.studyGoals.dailyHours * 7
                    newSettings.studyGoals.monthlyHours = localSettings.studyGoals.dailyHours * 30
                  }
                  
                  saveSettingsToDatabase(newSettings)
                }}
              />
              <Label htmlFor="autoCalculate">Auto-calculate from daily goal</Label>
            </div>
            
            {localSettings.studyGoals.autoCalculate && (
              <div className="text-sm text-muted-foreground">
                Weekly: {localSettings.studyGoals.dailyHours * 7}h | Monthly: {localSettings.studyGoals.dailyHours * 30}h
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Task Reminders</h3>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
                </div>
                <Switch
                                  checked={localSettings.notifications.taskReminders}
                onCheckedChange={(checked) => saveSettingsToDatabase({
                  notifications: {
                    ...localSettings.notifications,
                    taskReminders: checked
                  }
                })}
                />
              </div>
              
                             {localSettings.notifications.taskReminders && (
                <div className="ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                                             checked={localSettings.notifications.emailNotifications}
                                              onCheckedChange={(checked) => saveSettingsToDatabase({
                          notifications: {
                            ...localSettings.notifications,
                            emailNotifications: checked
                          }
                        })}
                    />
                    <Label>Email notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                                             checked={localSettings.notifications.pushNotifications}
                                              onCheckedChange={(checked) => saveSettingsToDatabase({
                          notifications: {
                            ...localSettings.notifications,
                            pushNotifications: checked
                          }
                        })}
                    />
                    <Label>Push notifications</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reminder time</Label>
                    <TimePicker
                                             value={localSettings.notifications.reminderTime}
                                              onChange={(time) => saveSettingsToDatabase({
                          notifications: {
                            ...localSettings.notifications,
                            reminderTime: time
                          }
                        })}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Study Session Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Study Session Alerts</h3>
                  <p className="text-sm text-muted-foreground">Reminders to start study sessions</p>
                </div>
                <Switch
                                   checked={localSettings.notifications.studySessionAlerts}
                                    onCheckedChange={(checked) => saveSettingsToDatabase({
                    notifications: {
                      ...localSettings.notifications,
                      studySessionAlerts: checked
                    }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all your study data as a JSON file
                </p>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </div>

            <Separator />

            {/* Import Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Import Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Restore your data from a previously exported file
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Backup Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto Backup</h3>
                  <p className="text-sm text-muted-foreground">Automatically backup your data</p>
                </div>
                <Switch
                                   checked={localSettings.dataManagement.autoBackup}
                                    onCheckedChange={(checked) => saveSettingsToDatabase({
                  dataManagement: {
                    ...localSettings.dataManagement,
                    autoBackup: checked
                  }
                })}
                />
              </div>
              
                             {localSettings.dataManagement.autoBackup && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <Label>Backup frequency</Label>
                    <Select
                                             value={localSettings.dataManagement.backupFrequency}
                                              onValueChange={(value) => saveSettingsToDatabase({
                          dataManagement: {
                            ...localSettings.dataManagement,
                            backupFrequency: value
                          }
                        })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {JSON.parse(localStorage.getItem("studySessions") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Study Sessions</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {JSON.parse(localStorage.getItem("tasks") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {JSON.parse(localStorage.getItem("subjects") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-info">
                  {JSON.parse(localStorage.getItem("testMarks") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Test Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
