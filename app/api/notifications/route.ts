import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const notifications = await dbService.getPrisma().notification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50 // Limit to last 50 notifications
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const body = await request.json()
    
    const notification = await dbService.getPrisma().notification.create({
      data: {
        userId,
        type: body.type,
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl,
        timestamp: new Date(),
        read: false
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
