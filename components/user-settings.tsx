"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useToast } from '@/hooks/use-toast'
import { Settings, Save, RefreshCw } from 'lucide-react'

export function UserSettings() {
  const { settings, loading, error, updateSetting, saveSettings, loadSettings } = useUserSettings()
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSettingChange = async <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    if (!settings) return
    
    try {
      // Update local state immediately for better UX
      const updatedSettings = { ...settings, [key]: value }
      console.log('🔧 handleSettingChange: Updating setting', { key, value, updatedSettings })
      
      // Update the database
      await updateSetting(key, value)
      
      toast({
        title: "Setting updated",
        description: `${key} has been updated successfully`,
      })
    } catch (error) {
      console.error('🔧 handleSettingChange: Error updating setting', { key, value, error })
      toast({
        title: "Update failed",
        description: `Failed to update ${key}`,
        variant: "destructive"
      })
    }
  }

  const handleSaveAll = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      await saveSettings(settings)
      toast({
        title: "Settings saved",
        description: "All settings have been saved to the database",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save settings to database",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>Error loading settings: {error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No settings found. Creating default settings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Settings
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="taskReminders">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming tasks
              </p>
            </div>
            <Switch
              id="taskReminders"
              checked={settings.taskReminders}
              onCheckedChange={(checked) => handleSettingChange('taskReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
            />
          </div>
        </div>

        {/* Study Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Study Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultStudyGoal">Default Study Goal (minutes)</Label>
              <Input
                id="defaultStudyGoal"
                type="number"
                value={settings.defaultStudyGoal}
                onChange={(e) => handleSettingChange('defaultStudyGoal', parseInt(e.target.value) || 240)}
                min="1"
                max="1440"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
              <Input
                id="breakDuration"
                type="number"
                value={settings.breakDuration}
                onChange={(e) => handleSettingChange('breakDuration', parseInt(e.target.value) || 15)}
                min="1"
                max="60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Reminder Time</Label>
              <Input
                id="reminderTime"
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredStudyTime">Preferred Study Time</Label>
              <Input
                id="preferredStudyTime"
                type="time"
                value={settings.preferredStudyTime}
                onChange={(e) => handleSettingChange('preferredStudyTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Display Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Display Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showProgressBars">Show Progress Bars</Label>
              <p className="text-sm text-muted-foreground">
                Display progress bars in the interface
              </p>
            </div>
            <Switch
              id="showProgressBars"
              checked={settings.showProgressBars}
              onCheckedChange={(checked) => handleSettingChange('showProgressBars', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use a more compact layout
              </p>
            </div>
            <Switch
              id="compactMode"
              checked={settings.compactMode}
              onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => handleSettingChange('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSaveAll} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>

        {/* Debug Info */}
        <div className="pt-4 border-t">
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Debug Info (Click to expand)
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
