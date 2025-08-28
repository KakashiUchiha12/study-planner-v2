import { dbService } from './database-service'
import { subjectService } from './subject-service'
import { chapterService } from './chapter-service'
import { materialService } from './material-service'
import { taskService } from './task-service'
import { studySessionService } from './study-session-service'
import { testMarkService } from './test-mark-service'
import { calendarEventService } from './calendar-event-service'

export interface MigrationResult {
  success: boolean
  migratedCount: {
    subjects: number
    chapters: number
    materials: number
    tasks: number
    studySessions: number
    testMarks: number
    calendarEvents: number
  }
  errors: string[]
}

export class MigrationUtility {
  private prisma = dbService.getPrisma()

  // Migrate all data from localStorage to database
  async migrateFromLocalStorage(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: {
        subjects: 0,
        chapters: 0,
        materials: 0,
        tasks: 0,
        studySessions: 0,
        testMarks: 0,
        calendarEvents: 0
      },
      errors: []
    }

    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      // Migrate subjects
      try {
        const subjectsCount = await this.migrateSubjects(userId)
        result.migratedCount.subjects = subjectsCount
      } catch (error) {
        result.errors.push(`Failed to migrate subjects: ${error}`)
        result.success = false
      }

      // Migrate chapters
      try {
        const chaptersCount = await this.migrateChapters(userId)
        result.migratedCount.chapters = chaptersCount
      } catch (error) {
        result.errors.push(`Failed to migrate chapters: ${error}`)
        result.success = false
      }

      // Migrate materials
      try {
        const materialsCount = await this.migrateMaterials(userId)
        result.migratedCount.materials = materialsCount
      } catch (error) {
        result.errors.push(`Failed to migrate materials: ${error}`)
        result.success = false
      }

      // Migrate tasks
      try {
        const tasksCount = await this.migrateTasks(userId)
        result.migratedCount.tasks = tasksCount
      } catch (error) {
        result.errors.push(`Failed to migrate tasks: ${error}`)
        result.success = false
      }

      // Migrate study sessions
      try {
        const sessionsCount = await this.migrateStudySessions(userId)
        result.migratedCount.studySessions = sessionsCount
      } catch (error) {
        result.errors.push(`Failed to migrate study sessions: ${error}`)
        result.success = false
      }

      // Migrate test marks
      try {
        const testMarksCount = await this.migrateTestMarks(userId)
        result.migratedCount.testMarks = testMarksCount
      } catch (error) {
        result.errors.push(`Failed to migrate test marks: ${error}`)
        result.success = false
      }

      // Migrate calendar events
      try {
        const calendarEventsCount = await this.migrateCalendarEvents(userId)
        result.migratedCount.calendarEvents = calendarEventsCount
      } catch (error) {
        result.errors.push(`Failed to migrate calendar events: ${error}`)
        result.success = false
      }

      if (result.errors.length > 0) {
        console.error('Migration completed with errors:', result.errors)
        return result
      }

      // Clear localStorage after successful migration
      if (result.success) {
        await this.clearLocalStorageAfterMigration()
      }

      return result
    } catch (error) {
      console.error('Migration failed:', error)
      return {
        success: false,
        migratedCount: { subjects: 0, chapters: 0, materials: 0, tasks: 0, studySessions: 0, testMarks: 0, calendarEvents: 0 },
        errors: [`Migration failed: ${error}`]
      }
    }
  }

  // Migrate subjects from localStorage
  private async migrateSubjects(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      const subjectsData = localStorage.getItem('subjects')
      if (!subjectsData) return 0

      const subjects = JSON.parse(subjectsData)
      let migratedCount = 0

      for (const subject of subjects) {
        try {
          // Check if subject already exists
          const existingSubject = await subjectService.getSubjectById(subject.id)
          if (existingSubject) continue

          // Create subject in database
          await subjectService.createSubject(userId, {
            name: subject.name,
            color: subject.color || '#3B82F6',
            description: subject.description || '',
            progress: subject.progress || 0,
            totalChapters: subject.totalChapters || 0,
            completedChapters: subject.completedChapters || 0
          })

          migratedCount++
        } catch (error) {
          console.error(`Failed to migrate subject ${subject.id}:`, error)
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate subjects:', error)
      throw error
    }
  }

  // Migrate tasks from localStorage
  private async migrateTasks(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      const tasksData = localStorage.getItem('tasks')
      if (!tasksData) return 0

      const tasks = JSON.parse(tasksData)
      let migratedCount = 0

      for (const task of tasks) {
        try {
          // Check if task already exists
          const existingTask = await taskService.getTaskById(task.id)
          if (existingTask) continue

          // Create task in database
          await taskService.createTask(userId, {
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            status: task.completed ? 'completed' : 'pending',
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            subjectId: task.subjectId || task.subject,
            estimatedTime: task.estimatedTime || 0,
            tags: task.tags || [],
            progress: task.progress || 0,
            timeSpent: task.timeSpent || 0
          })

          migratedCount++
        } catch (error) {
          console.error(`Failed to migrate task ${task.id}:`, error)
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate tasks:', error)
      throw error
    }
  }

  // Migrate study sessions from localStorage
  private async migrateStudySessions(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      const sessionsData = localStorage.getItem('studySessions')
      if (!sessionsData) return 0

      const sessions = JSON.parse(sessionsData)
      let migratedCount = 0

      for (const session of sessions) {
        try {
          // Check if session already exists
          const existingSession = await studySessionService.getStudySessionById(session.id)
          if (existingSession) continue

          // Create study session in database
          await studySessionService.createStudySession(userId, {
            subjectId: session.subjectId || session.subject,
            duration: session.duration || 0,
            startTime: new Date(session.startTime || session.date),
            endTime: new Date(session.endTime || session.date),
            notes: session.notes || '',
            efficiency: session.efficiency || 0,
            sessionType: session.sessionType || 'Focused Study',
            productivity: session.productivity || 0,
            topicsCovered: session.topicsCovered || [],
            materialsUsed: session.materialsUsed || []
          })

          migratedCount++
        } catch (error) {
          console.error(`Failed to migrate study session ${session.id}:`, error)
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate study sessions:', error)
      throw error
    }
  }

  // Migrate test marks from localStorage
  private async migrateTestMarks(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      const testMarksData = localStorage.getItem('testMarks')
      if (!testMarksData) return 0

      const testMarks = JSON.parse(testMarksData)
      let migratedCount = 0

      for (const testMark of testMarks) {
        try {
          // Check if test mark already exists
          const existingTestMark = await testMarkService.getTestMarkById(testMark.id)
          if (existingTestMark) continue

          // Create test mark in database
          await testMarkService.createTestMark(userId, {
            testName: testMark.testName || testMark.title || 'Test',
            subjectId: testMark.subjectId || testMark.subject || 'default-subject',
            score: testMark.score || testMark.marksObtained || 0,
            maxScore: testMark.maxScore || testMark.totalMarks || 100,
            testDate: new Date(testMark.testDate || testMark.date || Date.now()),
            testType: testMark.testType || 'EXAM'
          })

          migratedCount++
        } catch (error) {
          console.error(`Failed to migrate test mark ${testMark.id}:`, error)
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate test marks:', error)
      throw error
    }
  }

  // Migrate calendar events from localStorage
  private async migrateCalendarEvents(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      const eventsData = localStorage.getItem('calendar-events')
      if (!eventsData) return 0

      const events = JSON.parse(eventsData)
      let migratedCount = 0

      for (const event of events) {
        try {
          // Check if event already exists
          const existingEvent = await calendarEventService.getCalendarEventById(event.id)
          if (existingEvent) continue

          // Create calendar event in database
          await calendarEventService.createCalendarEvent(userId, {
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            type: event.type || 'study',
            description: event.description || '',
            location: event.location || '',
            priority: event.priority || 'medium',
            completed: event.completed || false,
            notificationEnabled: event.notificationEnabled || false,
            notificationTime: event.notificationTime || 15,
            color: event.color,
            recurringType: event.recurring?.type,
            recurringInterval: event.recurring?.interval,
            recurringEndDate: event.recurring?.endDate ? new Date(event.recurring.endDate) : undefined
          })

          migratedCount++
        } catch (error) {
          console.error(`Failed to migrate calendar event ${event.id}:`, error)
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate calendar events:', error)
      throw error
    }
  }

  // Clear localStorage after successful migration
  async clearLocalStorageAfterMigration(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const keysToRemove = ['subjects', 'tasks', 'studySessions', 'testMarks', 'calendar-events']
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log('LocalStorage cleared after successful migration')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }

  // Check if migration is needed
  async isMigrationNeeded(userId: string): Promise<boolean> {
    try {
      // Check if user has any data in database
      const [subjectsCount, chaptersCount, materialsCount, tasksCount, sessionsCount, testMarksCount, calendarEventsCount] = await Promise.all([
        this.prisma.subject.count({ where: { userId: userId } }),
        this.prisma.chapter.count({ where: { subject: { userId: userId } } }),
        this.prisma.material.count({ where: { chapter: { subject: { userId: userId } } } }),
        this.prisma.task.count({ where: { userId: userId } }),
        this.prisma.studySession.count({ where: { userId: userId } }),
        this.prisma.testMark.count({ where: { userId: userId } }),
        this.prisma.calendarEvent.count({ where: { userId: userId } })
      ])

      // If database has data, migration is not needed
      if (subjectsCount > 0 || chaptersCount > 0 || materialsCount > 0 || tasksCount > 0 || sessionsCount > 0 || testMarksCount > 0 || calendarEventsCount > 0) {
        return false
      }

      // Check if localStorage has data
      if (typeof window === 'undefined') return false

      const hasLocalData = ['subjects', 'tasks', 'studySessions', 'testMarks', 'calendar-events'].some(key => {
        const data = localStorage.getItem(key)
        return data && JSON.parse(data).length > 0
      })

      // Also check for chapters and materials data
      if (!hasLocalData) {
        const subjectsData = localStorage.getItem('subjects')
        if (subjectsData) {
          const subjects = JSON.parse(subjectsData)
          for (const subject of subjects) {
            const chaptersData = localStorage.getItem(`subject_chapters_${subject.id}`)
            const materialsData = localStorage.getItem(`subject_materials_${subject.id}`)
            if ((chaptersData && JSON.parse(chaptersData).length > 0) || 
                (materialsData && JSON.parse(materialsData).length > 0)) {
              return true
            }
          }
        }
      }

      return hasLocalData
    } catch (error) {
      console.error('Failed to check if migration is needed:', error)
      return false
    }
  }

  // Get migration status
  async getMigrationStatus(userId: string): Promise<{
    needsMigration: boolean
    databaseCounts: { subjects: number; chapters: number; materials: number; tasks: number; studySessions: number; testMarks: number; calendarEvents: number }
    localStorageCounts: { subjects: number; chapters: number; materials: number; tasks: number; studySessions: number; testMarks: number; calendarEvents: number }
  }> {
    try {
      // Get database counts
      const [subjectsCount, chaptersCount, materialsCount, tasksCount, sessionsCount, testMarksCount, calendarEventsCount] = await Promise.all([
        this.prisma.subject.count({ where: { userId: userId } }),
        this.prisma.chapter.count({ where: { subject: { userId: userId } } }),
        this.prisma.material.count({ where: { chapter: { subject: { userId: userId } } } }),
        this.prisma.task.count({ where: { userId: userId } }),
        this.prisma.studySession.count({ where: { userId: userId } }),
        this.prisma.testMark.count({ where: { userId: userId } }),
        this.prisma.calendarEvent.count({ where: { userId: userId } })
      ])

      // Get localStorage counts
      let localStorageCounts = { subjects: 0, chapters: 0, materials: 0, tasks: 0, studySessions: 0, testMarks: 0, calendarEvents: 0 }
      
      if (typeof window !== 'undefined') {
        try {
          const subjectsData = localStorage.getItem('subjects')
          const tasksData = localStorage.getItem('tasks')
          const sessionsData = localStorage.getItem('studySessions')
          const testMarksData = localStorage.getItem('testMarks')
          const calendarEventsData = localStorage.getItem('calendar-events')

          localStorageCounts = {
            subjects: subjectsData ? JSON.parse(subjectsData).length : 0,
            chapters: 0, // Will be calculated from subjects
            materials: 0, // Will be calculated from subjects
            tasks: tasksData ? JSON.parse(tasksData).length : 0,
            studySessions: sessionsData ? JSON.parse(sessionsData).length : 0,
            testMarks: testMarksData ? JSON.parse(testMarksData).length : 0,
            calendarEvents: calendarEventsData ? JSON.parse(calendarEventsData).length : 0
          }

          // Calculate chapters and materials counts from localStorage
          if (subjectsData) {
            const subjects = JSON.parse(subjectsData)
            for (const subject of subjects) {
              const chaptersData = localStorage.getItem(`subject_chapters_${subject.id}`)
              const materialsData = localStorage.getItem(`subject_materials_${subject.id}`)
              
              if (chaptersData) {
                localStorageCounts.chapters += JSON.parse(chaptersData).length
              }
              if (materialsData) {
                localStorageCounts.materials += JSON.parse(materialsData).length
              }
            }
          }
        } catch (error) {
          console.error('Failed to parse localStorage data:', error)
        }
      }

      const databaseCounts = { subjects: subjectsCount, chapters: chaptersCount, materials: materialsCount, tasks: tasksCount, studySessions: sessionsCount, testMarks: testMarksCount, calendarEvents: calendarEventsCount }
      
      const needsMigration = (
        localStorageCounts.subjects > 0 || 
        localStorageCounts.chapters > 0 ||
        localStorageCounts.materials > 0 ||
        localStorageCounts.tasks > 0 || 
        localStorageCounts.studySessions > 0 || 
        localStorageCounts.testMarks > 0 ||
        localStorageCounts.calendarEvents > 0
      ) && (
        databaseCounts.subjects === 0 && 
        databaseCounts.chapters === 0 &&
        databaseCounts.materials === 0 &&
        databaseCounts.tasks === 0 && 
        databaseCounts.studySessions === 0 && 
        databaseCounts.testMarks === 0 &&
        databaseCounts.calendarEvents === 0
      )

      return {
        needsMigration,
        databaseCounts,
        localStorageCounts
      }
    } catch (error) {
      console.error('Failed to get migration status:', error)
      return {
        needsMigration: false,
        databaseCounts: { subjects: 0, chapters: 0, materials: 0, tasks: 0, studySessions: 0, testMarks: 0, calendarEvents: 0 },
        localStorageCounts: { subjects: 0, chapters: 0, materials: 0, tasks: 0, studySessions: 0, testMarks: 0, calendarEvents: 0 }
      }
    }
  }

  // Migrate chapters from localStorage
  private async migrateChapters(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      let migratedCount = 0
      const subjects = await subjectService.getSubjectsByUserId(userId)

      for (const subject of subjects) {
        const chaptersKey = `subject_chapters_${subject.id}`
        const chaptersData = localStorage.getItem(chaptersKey)
        
        if (!chaptersData) continue

        const chapters = JSON.parse(chaptersData)
        
        for (const chapter of chapters) {
          try {
            // Check if chapter already exists
            const existingChapter = await chapterService.getChapterById(chapter.id)
            if (existingChapter) continue

            // Create chapter in database
            await chapterService.createChapter({
              subjectId: subject.id,
              title: chapter.title,
              description: chapter.description || '',
              order: chapter.order || 0,
              estimatedHours: chapter.estimatedHours || 2
            })

            migratedCount++
          } catch (error) {
            console.error(`Failed to migrate chapter ${chapter.id}:`, error)
          }
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate chapters:', error)
      throw error
    }
  }

  // Migrate materials from localStorage
  private async migrateMaterials(userId: string): Promise<number> {
    if (typeof window === 'undefined') return 0

    try {
      let migratedCount = 0
      const subjects = await subjectService.getSubjectsByUserId(userId)

      for (const subject of subjects) {
        const materialsKey = `subject_materials_${subject.id}`
        const materialsData = localStorage.getItem(materialsKey)
        
        if (!materialsData) continue

        const materials = JSON.parse(materialsData)
        
        for (const material of materials) {
          try {
            // Find the chapter this material belongs to
            const chapters = await chapterService.getChaptersBySubjectId(subject.id)
            const chapter = chapters.find(c => c.title === material.chapterTitle || c.order === material.chapterOrder)
            
            if (!chapter) {
              console.warn(`Chapter not found for material ${material.id}, skipping`)
              continue
            }

            // Check if material already exists
            const existingMaterial = await materialService.getMaterialById(material.id)
            if (existingMaterial) continue

            // Create material in database
            await materialService.createMaterial({
              chapterId: chapter.id,
              title: material.title,
              type: material.type || 'OTHER',
              content: material.content || '',
              fileUrl: material.fileUrl || '',
              fileSize: material.fileSize || 0,
              duration: material.duration || 0,
              order: material.order || 0
            })

            migratedCount++
          } catch (error) {
            console.error(`Failed to migrate material ${material.id}:`, error)
          }
        }
      }

      return migratedCount
    } catch (error) {
      console.error('Failed to migrate materials:', error)
      throw error
    }
  }
}

// Export singleton instance
export const migrationUtility = new MigrationUtility()
