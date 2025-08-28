import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface MigrationResult {
  success: boolean
  message: string
  subjectsMigrated: number
  tasksMigrated: number
  studySessionsMigrated: number
  testMarksMigrated: number
}

export function useMigration() {
  const { data: session } = useSession()
  const [migrating, setMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<{
    needsMigration: boolean
    databaseCounts: { subjects: number; tasks: number; studySessions: number; testMarks: number }
    localStorageCounts: { subjects: number; tasks: number; studySessions: number; testMarks: number }
  } | null>(null)

  // Get user ID from session
  const userId = session?.user?.id || 'demo-user-1'

  // Check if migration is needed
  const checkMigrationStatus = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/migration/status?checkLocalStorage=true`)
      if (!response.ok) {
        throw new Error('Failed to check migration status')
      }
      
      const status = await response.json()
      setMigrationStatus(status)
      return status
    } catch (error) {
      console.error('Failed to check migration status:', error)
      return null
    }
  }, [userId])

  // Perform migration from localStorage to database
  const migrateFromLocalStorage = useCallback(async (): Promise<MigrationResult> => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setMigrating(true)
      
      // Get localStorage data
      const subjects = JSON.parse(localStorage.getItem('subjects') || '[]')
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]')
      const testMarks = JSON.parse(localStorage.getItem('testMarks') || '[]')

      let subjectsMigrated = 0
      let tasksMigrated = 0
      let studySessionsMigrated = 0
      let testMarksMigrated = 0

      // Migrate subjects
      for (const subject of subjects) {
        try {
          const response = await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: subject.name,
              color: subject.color || '#3B82F6',
              description: subject.description || '',
              progress: subject.progress || 0,
              totalChapters: subject.totalChapters || 0,
              completedChapters: subject.completedChapters || 0
            })
          })
          if (response.ok) subjectsMigrated++
        } catch (error) {
          console.error('Failed to migrate subject:', subject.name, error)
        }
      }

      // Migrate tasks
      for (const task of tasks) {
        try {
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description || '',
              subjectId: task.subjectId || null,
              priority: task.priority || 'medium',
              status: task.status || 'pending',
              dueDate: task.dueDate || null,
              progress: task.progress || 0,
              timeSpent: task.timeSpent || 0
            })
          })
          if (response.ok) tasksMigrated++
        } catch (error) {
          console.error('Failed to migrate task:', task.title, error)
        }
      }

      // Migrate study sessions
      for (const session of studySessions) {
        try {
          const response = await fetch('/api/study-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subjectId: session.subjectId || null,
              durationMinutes: session.duration || 0,
              startTime: session.startTime || session.date || new Date().toISOString(),
              endTime: session.endTime || new Date().toISOString(),
              notes: session.notes || '',
              efficiency: session.efficiency || null,
              sessionType: session.sessionType || 'Focused Study',
              productivity: session.productivity || null,
              topicsCovered: session.topicsCovered || [],
              materialsUsed: session.materialsUsed || []
            })
          })
          if (response.ok) studySessionsMigrated++
        } catch (error) {
          console.error('Failed to migrate study session:', session.id, error)
        }
      }

      // Migrate test marks
      for (const testMark of testMarks) {
        try {
          const response = await fetch('/api/test-marks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subjectId: testMark.subjectId || 'unknown',
              testName: testMark.testName || testMark.title || 'Test',
              testType: testMark.testType || 'Quiz',
              score: testMark.score || testMark.marksObtained || 0,
              maxScore: testMark.maxScore || testMark.totalMarks || 100,
              testDate: testMark.testDate || testMark.date || new Date().toISOString(),
              notes: testMark.notes || testMark.comments || ''
            })
          })
          if (response.ok) testMarksMigrated++
        } catch (error) {
          console.error('Failed to migrate test mark:', testMark.id, error)
        }
      }

      const result: MigrationResult = {
        success: true,
        message: `Migration completed successfully. ${subjectsMigrated} subjects, ${tasksMigrated} tasks, ${studySessionsMigrated} study sessions, and ${testMarksMigrated} test marks migrated.`,
        subjectsMigrated,
        tasksMigrated,
        studySessionsMigrated,
        testMarksMigrated
      }

      // Update migration status
      await checkMigrationStatus()
      
      return result
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    } finally {
      setMigrating(false)
    }
  }, [userId, checkMigrationStatus])

  // Check if migration is needed
  const isMigrationNeeded = useCallback(async (): Promise<boolean> => {
    if (!userId) return false

    try {
      const status = await checkMigrationStatus()
      return status?.needsMigration || false
    } catch (error) {
      console.error('Failed to check if migration is needed:', error)
      return false
    }
  }, [userId, checkMigrationStatus])

  // Auto-migrate if needed (called on component mount)
  const autoMigrateIfNeeded = useCallback(async () => {
    if (!userId) return

    try {
      const needsMigration = await isMigrationNeeded()
      if (needsMigration) {
        console.log('Auto-migration needed, starting migration...')
        await migrateFromLocalStorage()
      }
    } catch (error) {
      console.error('Auto-migration failed:', error)
    }
  }, [userId, isMigrationNeeded, migrateFromLocalStorage])

  // Clear localStorage after successful migration
  const clearLocalStorageAfterMigration = useCallback(async () => {
    try {
      localStorage.removeItem('subjects')
      localStorage.removeItem('tasks')
      localStorage.removeItem('studySessions')
      localStorage.removeItem('testMarks')
      console.log('localStorage cleared after successful migration')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }, [])

  return {
    migrating,
    migrationStatus,
    checkMigrationStatus,
    migrateFromLocalStorage,
    isMigrationNeeded,
    autoMigrateIfNeeded,
    clearLocalStorageAfterMigration
  }
}
