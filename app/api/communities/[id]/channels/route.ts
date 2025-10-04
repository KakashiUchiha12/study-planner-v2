import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Channels API: Starting request');
    const session = await getServerSession(authOptions);
    console.log('Channels API: Session:', session ? 'exists' : 'null');
    
    if (!session?.user?.id) {
      console.log('Channels API: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;
    console.log('Channels API: Community ID:', communityId);

    // Check if user is a member of the community
    console.log('Channels API: Checking membership for user:', session.user.id);
    const membership = await dbService.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    console.log('Channels API: Membership found:', membership ? 'yes' : 'no');
    if (!membership) {
      console.log('Channels API: User not a member, returning 403');
      return NextResponse.json(
        { error: 'You must be a member of this community to view channels' },
        { status: 403 }
      );
    }

    // Fetch channels for the community
    const channels = await dbService.prisma.communityChannel.findMany({
      where: {
        communityId
      },
      orderBy: {
        order: 'asc'
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            author: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Transform channels to include message count and last message
    const transformedChannels = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      isPrivate: channel.isPrivate,
      order: channel.order,
      messageCount: channel._count.messages,
      lastMessage: channel.messages[0] ? {
        content: channel.messages[0].content,
        author: {
          name: channel.messages[0].author.name,
          image: channel.messages[0].author.image
        },
        createdAt: channel.messages[0].createdAt.toISOString()
      } : undefined
    }));

    console.log('Channels API: Returning channels:', transformedChannels.length);
    return NextResponse.json({ 
      channels: transformedChannels,
      userRole: membership.role
    });

  } catch (error) {
    console.error('Channels API: Error fetching channels:', error);
    // Return empty channels array to prevent fetch failures
    return NextResponse.json({ 
      channels: [],
      userRole: 'MEMBER'
    });
  }
}

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
    const body = await request.json();
    const { name, description, type = 'text', isPrivate = false } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    // Check if user is an admin/moderator of the community
    const membership = await dbService.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    console.log('Channels API: User role:', membership.role);
    if (!membership || !['admin', 'moderator', 'owner'].includes(membership.role)) {
      console.log('Channels API: User not authorized to create channels');
      return NextResponse.json(
        { error: 'Only admins, moderators, and owners can create channels' },
        { status: 403 }
      );
    }

    // Check if channel name already exists
    const existingChannel = await dbService.prisma.communityChannel.findFirst({
      where: {
        communityId,
        name: name.trim()
      }
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'A channel with this name already exists' },
        { status: 400 }
      );
    }

    // Get the next order number
    const lastChannel = await dbService.prisma.communityChannel.findFirst({
      where: { communityId },
      orderBy: { order: 'desc' }
    });

    const newOrder = (lastChannel?.order || 0) + 1;

    // Create the channel
    const channel = await dbService.prisma.communityChannel.create({
      data: {
        communityId,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        isPrivate,
        order: newOrder
      }
    });

    return NextResponse.json({ 
      message: 'Channel created successfully',
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isPrivate: channel.isPrivate,
        order: channel.order,
        messageCount: 0
      }
    });

  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
