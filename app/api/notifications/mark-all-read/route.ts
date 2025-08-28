import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT() {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    // Mark all unread notifications as read
    await dbService.getPrisma().notification.updateMany({
      where: { 
        userId,
        read: false
      },
      data: { read: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
