import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { searchParams } = new URL(request.url)
    const checkLocalStorage = searchParams.get('checkLocalStorage') === 'true'

    // Get database counts
    const [subjectsCount, tasksCount, sessionsCount, testMarksCount, calendarEventsCount] = await Promise.all([
      dbService.getPrisma().subject.count({ where: { userId: userId } }),
      dbService.getPrisma().task.count({ where: { userId: userId } }),
      dbService.getPrisma().studySession.count({ where: { userId: userId } }),
      dbService.getPrisma().testMark.count({ where: { userId: userId } }),
      dbService.getPrisma().calendarEvent.count({ where: { userId: userId } })
    ])

    const databaseCounts = { subjects: subjectsCount, tasks: tasksCount, studySessions: sessionsCount, testMarks: testMarksCount, calendarEvents: calendarEventsCount }
    
    // Get localStorage counts
    let localStorageCounts = { subjects: 0, tasks: 0, studySessions: 0, testMarks: 0, calendarEvents: 0 }
    let needsMigration = false

    if (checkLocalStorage && typeof window !== 'undefined') {
      try {
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]')
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]')
        const testMarks = JSON.parse(localStorage.getItem('testMarks') || '[]')
        const calendarEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]')

        localStorageCounts = {
          subjects: subjects.length,
          tasks: tasks.length,
          studySessions: studySessions.length,
          testMarks: testMarks.length,
          calendarEvents: calendarEvents.length
        }

        // Check if migration is needed
        needsMigration = (
          subjects.length > 0 || 
          tasks.length > 0 || 
          studySessions.length > 0 || 
          testMarks.length > 0 ||
          calendarEvents.length > 0
        ) && (
          subjectsCount === 0 && 
          tasksCount === 0 && 
          sessionsCount === 0 && 
          testMarksCount === 0 &&
          calendarEventsCount === 0
        )
      } catch (error) {
        console.error('Failed to check localStorage:', error)
      }
    }

    return NextResponse.json({
      needsMigration,
      databaseCounts,
      localStorageCounts
    })
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    )
  }
}
