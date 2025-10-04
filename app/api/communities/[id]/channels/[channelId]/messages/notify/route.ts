import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, channelId } = await params;
    const body = await request.json();
    const { messageId, messageContent, authorName } = body;

    // Get all community members except the message author
    const members = await dbService.prisma.communityMember.findMany({
      where: {
        communityId,
        userId: { not: session.user.id }, // Exclude the message author
        status: 'active'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notifications for all members
    const notifications = members.map(member => ({
      userId: member.user.id,
      type: 'community_message',
      title: `New message in #${channelId}`,
      message: `${authorName}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
      data: JSON.stringify({
        communityId,
        channelId,
        messageId,
        type: 'chat_message'
      }),
      isRead: false
    }));

    if (notifications.length > 0) {
      await dbService.prisma.notification.createMany({
        data: notifications
      });
    }

    return NextResponse.json({ 
      message: 'Notifications sent successfully',
      recipients: notifications.length
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
