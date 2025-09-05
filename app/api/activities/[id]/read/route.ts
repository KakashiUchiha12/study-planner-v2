import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { userActivityService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const activityId = id

    const activity = await userActivityService.markAsRead(activityId)
    return NextResponse.json(activity)
  } catch (error) {
    console.error('Failed to mark activity as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark activity as read' },
      { status: 500 }
    )
  }
}
