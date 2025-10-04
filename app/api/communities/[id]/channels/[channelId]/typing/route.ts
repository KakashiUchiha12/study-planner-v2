import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';
import { pusherServer } from '@/lib/pusher';

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
    const { action } = body;

    // Check if user is a member of the community
    const membership = await dbService.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
    }

    // Verify channel exists and belongs to community
    const channel = await dbService.prisma.communityChannel.findFirst({
      where: {
        id: channelId,
        communityId
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Get user info for typing indicator
    const user = await dbService.prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send typing event via Pusher
    const eventName = action === 'start' ? 'user-typing' : 'user-stopped-typing';
    await pusherServer.trigger(`community-channel-${channelId}`, eventName, {
      userId: user.id,
      userName: user.name,
      userImage: user.image
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error handling typing indicator:', error);
    return NextResponse.json(
      { error: 'Failed to handle typing indicator' },
      { status: 500 }
    );
  }
}
