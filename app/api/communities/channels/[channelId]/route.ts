import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = await params;
    const { name, description, type, isPrivate } = await request.json();

    // Get the channel and check permissions
    const channel = await dbService.prisma.communityChannel.findUnique({
      where: { id: channelId },
      include: {
        community: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const membership = channel.community.members[0];
    if (!membership || !['admin', 'moderator', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins, moderators, and owners can edit channels' },
        { status: 403 }
      );
    }

    // Check if channel name already exists (excluding current channel)
    const existingChannel = await dbService.prisma.communityChannel.findFirst({
      where: {
        communityId: channel.communityId,
        name,
        id: { not: channelId }
      }
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'A channel with this name already exists' },
        { status: 400 }
      );
    }

    // Update the channel
    const updatedChannel = await dbService.prisma.communityChannel.update({
      where: { id: channelId },
      data: {
        name,
        description: description || null,
        type,
        isPrivate
      }
    });

    return NextResponse.json({ 
      message: 'Channel updated successfully',
      channel: updatedChannel
    });

  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = await params;

    // Get the channel and check permissions
    const channel = await dbService.prisma.communityChannel.findUnique({
      where: { id: channelId },
      include: {
        community: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const membership = channel.community.members[0];
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can delete channels' },
        { status: 403 }
      );
    }

    // Allow deletion of all channels including default ones

    // Delete the channel (this will cascade delete messages and reactions)
    await dbService.prisma.communityChannel.delete({
      where: { id: channelId }
    });

    return NextResponse.json({ 
      message: 'Channel deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
