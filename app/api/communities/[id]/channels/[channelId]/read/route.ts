import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

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

    // Verify user is a member of the community
    const membership = await dbService.getPrisma().communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
    }

    // Verify channel exists and belongs to the community
    const channel = await dbService.getPrisma().communityChannel.findFirst({
      where: {
        id: channelId,
        communityId
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Mark messages as read for this user in this channel
    try {
      await dbService.getPrisma().communityMessageRead.upsert({
        where: {
          channelId_userId: {
            channelId,
            userId: session.user.id
          }
        },
        update: {
          lastReadAt: new Date()
        },
        create: {
          channelId,
          userId: session.user.id,
          lastReadAt: new Date()
        }
      });
    } catch (error) {
      console.log('CommunityMessageRead table not available, skipping read tracking');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
