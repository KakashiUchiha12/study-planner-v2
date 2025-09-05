import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { userActivityService } from '@/lib/database'

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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const limit = parseInt(searchParams.get('limit') || '10')

    // If limit is specified, return recent activities (for OverviewTab)
    if (searchParams.has('limit')) {
      const activities = await userActivityService.getRecentActivities(userId, limit)
      return NextResponse.json(activities)
    }

    // Otherwise return paginated activities (for View All page)
    const result = await userActivityService.getUserActivities(userId, page, pageSize)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      )
    }

    const activity = await userActivityService.createActivity({
      userId,
      type: body.type,
      title: body.title,
      description: body.description,
      metadata: body.metadata
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
