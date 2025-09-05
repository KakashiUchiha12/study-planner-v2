import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { userActivityService } from '@/lib/database'

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

    await userActivityService.markAllAsRead(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all activities as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all activities as read' },
      { status: 500 }
    )
  }
}
