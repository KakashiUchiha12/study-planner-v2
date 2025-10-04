import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Mark all community messages as read for this user
    try {
      // Get all channels the user is a member of
      const userChannels = await dbService.getPrisma().communityMember.findMany({
        where: {
          userId: userId,
          status: 'active'
        },
        include: {
          community: {
            include: {
              channels: true
            }
          }
        }
      });

      // Mark all messages in these channels as read
      for (const membership of userChannels) {
        for (const channel of membership.community.channels) {
          await dbService.getPrisma().communityMessageRead.upsert({
            where: {
              channelId_userId: {
                channelId: channel.id,
                userId: userId,
              },
            },
            update: {
              lastReadAt: new Date(),
            },
            create: {
              channelId: channel.id,
              userId: userId,
              lastReadAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.log('CommunityMessageRead table not available, skipping read tracking');
    }

    return NextResponse.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
