import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, channelId, messageId } = await params;
    const { emoji } = await request.json();

    // Check if user is a member of the community
    const membership = await dbService.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this community to react to messages' },
        { status: 403 }
      );
    }

    // Check if the message exists and belongs to the channel
    const message = await dbService.prisma.communityMessage.findFirst({
      where: {
        id: messageId,
        channelId
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await dbService.prisma.communityMessageReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    });

    if (existingReaction) {
      // Remove the reaction
      await dbService.prisma.communityMessageReaction.delete({
        where: { id: existingReaction.id }
      });
    } else {
      // Add the reaction
      await dbService.prisma.communityMessageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji
        }
      });
    }

    return NextResponse.json({ 
      message: 'Reaction toggled successfully'
    });

  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    );
  }
}
