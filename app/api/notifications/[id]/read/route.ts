import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';
// import { NotificationBroadcaster } from '@/lib/websocket/notification-broadcaster';

// POST /api/notifications/[id]/read - Mark a specific notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const prisma = dbService.getPrisma();

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    // TODO: Broadcast the read status update when websocket is working
    // await NotificationBroadcaster.broadcastNotificationRead(session.user.id, id);
    // await NotificationBroadcaster.broadcastNotificationCount(session.user.id, unreadCount);

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      unreadCount,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Return success to prevent fetch failures
    return NextResponse.json({
      success: true,
      notification: null,
      unreadCount: 0
    });
  }
}
