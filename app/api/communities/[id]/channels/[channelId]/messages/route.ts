import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';
import { pusherServer } from '@/lib/pusher';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, channelId } = await params;

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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause for polling support
    const whereClause: any = {
      channelId,
      isDeleted: false
    };

    // If 'after' parameter is provided, fetch messages after that message ID or timestamp
    if (after) {
      // Check if 'after' is a timestamp (ISO string) or message ID
      if (after.includes('T') && after.includes('Z')) {
        // It's a timestamp
        whereClause.createdAt = {
          gt: new Date(after)
        };
      } else {
        // It's a message ID, find the message and get its timestamp
        const afterMessage = await dbService.getPrisma().communityMessage.findUnique({
          where: { id: after },
          select: { createdAt: true }
        });
        
        if (afterMessage) {
          whereClause.createdAt = {
            gt: afterMessage.createdAt
          };
        }
      }
    }

    // Fetch messages with author info and reactions
    const messages = await dbService.prisma.communityMessage.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: after ? 'asc' : 'desc' },
      take: after ? limit : 50, // For polling use provided limit, otherwise default 50
      ...(after ? {} : { skip: 0 }) // For polling, don't skip; for initial load, no skip
    });

    // Transform messages to include reaction counts
    const transformedMessages = messages.map(message => {
      const reactionMap = new Map();
      
      message.reactions.forEach(reaction => {
        const key = reaction.emoji;
        if (!reactionMap.has(key)) {
          reactionMap.set(key, {
            emoji: key,
            count: 0,
            userReacted: false
          });
        }
        reactionMap.get(key).count++;
        if (reaction.user.id === session.user.id) {
          reactionMap.get(key).userReacted = true;
        }
      });

      return {
        id: message.id,
        content: message.content,
        type: message.type,
        author: {
          id: message.author.id,
          name: message.author.name,
          image: message.author.image
        },
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          author: {
            id: message.replyTo.author.id,
            name: message.replyTo.author.name
          }
        } : null,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt.toISOString(),
        reactions: Array.from(reactionMap.values())
      };
    });

    // For initial load (desc order), reverse the messages to show chronologically
    // For polling (asc order), keep the order as is
    const finalMessages = after ? transformedMessages : transformedMessages.reverse();
    
    return NextResponse.json({ messages: finalMessages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

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
    const { content, replyToId } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

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

    // Create the message
    const message = await dbService.prisma.communityMessage.create({
      data: {
        channelId,
        authorId: session.user.id,
        content: content.trim(),
        replyToId: replyToId || null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replyTo: replyToId ? {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        } : undefined
      }
    });

    // Transform message for Pusher
    const transformedMessage = {
      id: message.id,
      content: message.content,
      type: message.type,
      author: {
        id: message.author.id,
        name: message.author.name,
        image: message.author.image
      },
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        author: {
          id: message.replyTo.author.id,
          name: message.replyTo.author.name
        }
      } : null,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
      reactions: []
    };

    // Send real-time update via Pusher
    await pusherServer.trigger(`community-channel-${channelId}`, 'new-message', {
      message: transformedMessage
    });

    // Send notifications to channel members
    try {
      await fetch(`${request.nextUrl.origin}/api/communities/${communityId}/channels/${channelId}/messages/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.id,
          messageContent: message.content,
          authorName: message.author.name
        }),
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't fail the message creation if notifications fail
    }

    return NextResponse.json({ message: transformedMessage });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
