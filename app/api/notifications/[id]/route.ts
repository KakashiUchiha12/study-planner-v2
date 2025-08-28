import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: notificationId } = await params
    const body = await request.json()

    // Verify the notification belongs to the user
    const existingNotification = await dbService.getPrisma().notification.findFirst({
      where: { id: notificationId, userId: userId }
    })

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const updatedNotification = await dbService.getPrisma().notification.update({
      where: { id: notificationId },
      data: {
        ...(body.read !== undefined && { read: body.read }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.actionUrl !== undefined && { actionUrl: body.actionUrl })
      }
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: notificationId } = await params

    // Verify the notification belongs to the user
    const existingNotification = await dbService.getPrisma().notification.findFirst({
      where: { id: notificationId, userId: userId }
    })

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await dbService.getPrisma().notification.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
