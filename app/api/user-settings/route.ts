import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // Get user settings from database
    const userSettings = await dbService.getPrisma().userSettings.findUnique({
      where: { userId }
    })

    if (!userSettings) {
      // Create default settings if none exist
      const defaultSettings = await dbService.getPrisma().userSettings.create({
        data: {
          userId,
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
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(userSettings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const body = await request.json()

    // Update or create user settings
    const userSettings = await dbService.getPrisma().userSettings.upsert({
      where: { userId },
      update: {
        taskReminders: body.taskReminders,
        emailNotifications: body.emailNotifications,
        pushNotifications: body.pushNotifications,
        reminderTime: body.reminderTime,
        studySessionAlerts: body.studySessionAlerts,
        defaultStudyGoal: body.defaultStudyGoal,
        preferredStudyTime: body.preferredStudyTime,
        breakReminders: body.breakReminders,
        breakDuration: body.breakDuration,
        theme: body.theme,
        dashboardLayout: body.dashboardLayout,
        showProgressBars: body.showProgressBars,
        compactMode: body.compactMode,
        autoBackup: body.autoBackup,
        dataRetentionDays: body.dataRetentionDays,
        updatedAt: new Date()
      },
      create: {
        userId,
        taskReminders: body.taskReminders ?? true,
        emailNotifications: body.emailNotifications ?? false,
        pushNotifications: body.pushNotifications ?? true,
        reminderTime: body.reminderTime ?? "09:00",
        studySessionAlerts: body.studySessionAlerts ?? true,
        defaultStudyGoal: body.defaultStudyGoal ?? 240,
        preferredStudyTime: body.preferredStudyTime ?? "18:00",
        breakReminders: body.breakReminders ?? true,
        breakDuration: body.breakDuration ?? 15,
        theme: body.theme ?? "system",
        dashboardLayout: body.dashboardLayout ?? "default",
        showProgressBars: body.showProgressBars ?? true,
        compactMode: body.compactMode ?? false,
        autoBackup: body.autoBackup ?? true,
        dataRetentionDays: body.dataRetentionDays ?? 365
      }
    })

    return NextResponse.json(userSettings)
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}
