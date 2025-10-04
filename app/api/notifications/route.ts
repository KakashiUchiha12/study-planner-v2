import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma();
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause = {
      userId,
      ...(unreadOnly && { read: false })
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    const totalUnread = await prisma.notification.count({
      where: { userId, read: false }
    });

    return NextResponse.json({
      notifications,
      totalUnread,
      hasMore: notifications.length === limit
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty result instead of error to prevent fetch failures
    return NextResponse.json({
      notifications: [],
      totalUnread: 0,
      hasMore: false
    });
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma();
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { notificationId, notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      });
    } else if (notificationId) {
      // Update single notification
      await prisma.notification.updateMany({
        where: { 
          id: notificationId,
          userId 
        },
        data: { read: true }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: { 
          id: { in: notificationIds },
          userId 
        },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma();
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: { 
        id: notificationId,
        userId 
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}