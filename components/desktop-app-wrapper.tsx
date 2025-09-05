'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { ElectronAPI } from '@/types/electron'

interface DesktopAppWrapperProps {
  children: React.ReactNode
}

export const DesktopAppWrapper: React.FC<DesktopAppWrapperProps> = ({ children }) => {
  const [isElectron, setIsElectron] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // Check if running in Electron
    const electron = typeof window !== 'undefined' && window.electronAPI
    setIsElectron(!!electron)

    if (electron) {
      // Get app version
      electron.getAppVersion().then(setAppVersion)
      
      // Set up menu event listeners
      electron.onMenuNewTask(() => {
        router.push('/tasks')
        toast.success('Opening Tasks page')
      })

      electron.onMenuNewSubject(() => {
        router.push('/subjects')
        toast.success('Opening Subjects page')
      })

      electron.onMenuExportData(() => {
        handleExportData()
      })

      electron.onMenuImportData(() => {
        handleImportData()
      })

      electron.onMenuStartStudy(() => {
        router.push('/study-sessions')
        toast.success('Opening Study Sessions')
      })

      electron.onMenuDashboard(() => {
        router.push('/dashboard')
        toast.success('Opening Dashboard')
      })

      electron.onMenuTasks(() => {
        router.push('/tasks')
        toast.success('Opening Tasks')
      })

      electron.onMenuSubjects(() => {
        router.push('/subjects')
        toast.success('Opening Subjects')
      })

      electron.onMenuShortcuts(() => {
        showKeyboardShortcuts()
      })

      // Show welcome notification
      setTimeout(() => {
        electron.showNotification({
          title: 'StudyPlanner Desktop',
          body: 'Welcome to your study management app!',
          silent: false
        })
      }, 2000)
    }

      return () => {
      // Clean up listeners
      if (electron) {
        electron.removeAllListeners('menu-new-task')
        electron.removeAllListeners('menu-new-subject')
        electron.removeAllListeners('menu-export-data')
        electron.removeAllListeners('menu-import-data')
        electron.removeAllListeners('menu-start-study')
        electron.removeAllListeners('menu-dashboard')
        electron.removeAllListeners('menu-tasks')
        electron.removeAllListeners('menu-subjects')
        electron.removeAllListeners('menu-shortcuts')
      }
    }
  }, [router])

  const handleExportData = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.showSaveDialog({
        defaultPath: `studyplanner-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!result.canceled && result.filePath) {
        // Get all data from localStorage
        const data = {
          subjects: JSON.parse(localStorage.getItem('subjects') || '[]'),
          tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
          studySessions: JSON.parse(localStorage.getItem('studySessions') || '[]'),
          testMarks: JSON.parse(localStorage.getItem('testMarks') || '[]'),
          goals: JSON.parse(localStorage.getItem('goals') || '[]'),
          skills: JSON.parse(localStorage.getItem('skills') || '[]'),
          exportDate: new Date().toISOString(),
          version: appVersion
        }

        const writeResult = await window.electronAPI.writeFile(result.filePath, JSON.stringify(data, null, 2))
        
        if (writeResult.success) {
          toast.success('Data exported successfully!')
        } else {
          toast.error('Failed to export data')
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const handleImportData = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!result.canceled && result.filePaths.length > 0) {
        const readResult = await window.electronAPI.readFile(result.filePaths[0])
        
        if (readResult.success && readResult.data) {
          const data = JSON.parse(readResult.data)
          
          // Import data to localStorage
          if (data.subjects) localStorage.setItem('subjects', JSON.stringify(data.subjects))
          if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks))
          if (data.studySessions) localStorage.setItem('studySessions', JSON.stringify(data.studySessions))
          if (data.testMarks) localStorage.setItem('testMarks', JSON.stringify(data.testMarks))
          if (data.goals) localStorage.setItem('goals', JSON.stringify(data.goals))
          if (data.skills) localStorage.setItem('skills', JSON.stringify(data.skills))

          toast.success('Data imported successfully!')
          
          // Refresh the page to show imported data
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          toast.error('Failed to read import file')
        }
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import data')
    }
  }

  const showKeyboardShortcuts = () => {
    if (!window.electronAPI) return

    window.electronAPI.showMessageBox({
      type: 'info',
      title: 'Keyboard Shortcuts',
      message: 'StudyPlanner Keyboard Shortcuts',
      detail: `Ctrl+N - New Task
Ctrl+Shift+N - New Subject
Ctrl+S - Start Study Session
Ctrl+D - Dashboard
Ctrl+T - Tasks
Ctrl+Shift+T - Subjects
Ctrl+Q - Quit Application

Double-click system tray icon to show window.`
    })
  }

  // Add desktop-specific UI elements
  if (isElectron) {
    return (
      <div className="desktop-app">
        {/* Desktop-specific header */}
        <div className="desktop-header">
          <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">SP</span>
              </div>
              <span className="text-sm font-medium text-gray-700">StudyPlanner Desktop</span>
              {appVersion && (
                <span className="text-xs text-gray-500">v{appVersion}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => window.electronAPI?.minimizeWindow()}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded"
                title="Minimize"
              >
                <span className="text-xs">−</span>
              </button>
              <button
                onClick={() => window.electronAPI?.maximizeWindow()}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded"
                title="Maximize"
              >
                <span className="text-xs">□</span>
              </button>
              <button
                onClick={() => window.electronAPI?.closeWindow()}
                className="w-6 h-6 flex items-center justify-center hover:bg-red-200 rounded"
                title="Close"
              >
                <span className="text-xs">×</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="desktop-content">
          {children}
        </div>
      </div>
    )
  }

  // Regular web app
  return <>{children}</>
}

export const DesktopStatusBar: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const electron = typeof window !== 'undefined' && window.electronAPI
    setIsElectron(!!electron)
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isElectron) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <span>StudyPlanner Desktop</span>
      </div>
      <div className="flex items-center space-x-2">
        <span>Ready</span>
      </div>
    </div>
  )
}

export default DesktopAppWrapper