import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;

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
        { error: 'You must be a member of this community to initialize channels' },
        { status: 403 }
      );
    }

    // Check if channels already exist
    const existingChannels = await dbService.prisma.communityChannel.count({
      where: { communityId }
    });

    if (existingChannels > 0) {
      return NextResponse.json(
        { error: 'Channels already exist for this community' },
        { status: 400 }
      );
    }

    // Create default channels
    const defaultChannels = [
      {
        name: 'general',
        description: 'General discussion for the community',
        type: 'text',
        order: 1
      },
      {
        name: 'announcements',
        description: 'Important announcements and updates',
        type: 'announcement',
        order: 2
      }
    ];

    const createdChannels = await dbService.prisma.communityChannel.createMany({
      data: defaultChannels.map(channel => ({
        communityId,
        ...channel
      }))
    });

    return NextResponse.json({ 
      message: 'Default channels created successfully',
      channelsCreated: createdChannels.count
    });

  } catch (error) {
    console.error('Error initializing channels:', error);
    return NextResponse.json(
      { error: 'Failed to initialize channels' },
      { status: 500 }
    );
  }
}
