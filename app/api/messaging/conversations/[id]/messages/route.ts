import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';
import { pusherServer } from '@/lib/pusher';
import { PresenceManager } from '@/lib/presence/presence-manager';
import { MessageNotificationHandler } from '@/lib/notifications/message-notification-handler';

// GET /api/messaging/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const after = searchParams.get('after'); // For polling - get messages after this ID
    const offset = (page - 1) * limit;

    const prisma = dbService.getPrisma();

    // Check if user is participant in the conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Unauthorized to view this conversation' },
        { status: 403 }
      );
    }

    // Build where clause based on whether we're polling or paginating
    const whereClause: any = {
      conversationId: id,
      deletedAt: null,
    };

    // If polling (after parameter), get messages after the specified timestamp or message ID
    if (after) {
      // Check if 'after' is a timestamp (ISO string) or message ID
      const isTimestamp = after.includes('T') && after.includes('Z');
      
      if (isTimestamp) {
        // 'after' is a timestamp
        whereClause.createdAt = {
          gt: new Date(after)
        };
      } else {
        // 'after' is a message ID - get the timestamp of that message
        const afterMessage = await prisma.message.findUnique({
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

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: after ? 'asc' : 'desc', // For polling, get oldest first; for pagination, get newest first
      },
      skip: after ? 0 : offset, // For polling, don't skip; for pagination, use offset
      take: limit,
    });

    // Update last read timestamp for the user
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Track user presence - they're actively viewing this conversation
    await PresenceManager.trackUserActivity(session.user.id, id);
    
    // Mark message notifications as read for this conversation
    await MessageNotificationHandler.markMessageNotificationsAsRead(session.user.id, id);

    // For polling, return messages as-is (already in ascending order)
    // For pagination, reverse to show oldest first
    return NextResponse.json(after ? messages : messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/conversations/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔔 SERVER: ################## MESSAGE API CALLED ##################');
  console.log('🔔 SERVER: POST /api/messaging/conversations/[id]/messages called');
  console.log('🔔 SERVER: Timestamp:', new Date().toISOString());
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('🔔 SERVER: Unauthorized - no session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('🔔 SERVER: User authenticated:', session.user.id);

    const { id } = await params;
    const body = await request.json();
    const { content, type = 'text', replyToId, attachments = [] } = body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const prisma = dbService.getPrisma();

    // Check if user is participant in the conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Unauthorized to send messages to this conversation' },
        { status: 403 }
      );
    }

    // If replying to a message, verify the reply-to message exists in this conversation
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId: id,
          deletedAt: null,
        },
      });

      if (!replyToMessage) {
        return NextResponse.json(
          { error: 'Reply-to message not found' },
          { status: 400 }
        );
      }
    }

    // Create the message
    console.log('🔔 SERVER: Creating message in database...');
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        content: content.trim(),
        type,
        replyToId,
        attachments: {
          create: attachments.map((attachment: any) => ({
            type: attachment.type,
            url: attachment.url,
            name: attachment.name,
            size: attachment.size,
            mimeType: attachment.mimeType,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });
    console.log('🔔 SERVER: Message created successfully:', message.id);

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Update sender's last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Send real-time update to all participants
    console.log('🔔 SERVER: ========== STARTING REAL-TIME BROADCAST ==========');
    console.log('🔔 SERVER: Message ID:', message.id);
    console.log('🔔 SERVER: Conversation ID:', id);
    console.log('🔔 SERVER: Message content:', message.content);
    
    try {
      // Direct Socket.IO broadcast (bypassing pusherServer for debugging)
      console.log('🔔 SERVER: Attempting direct Socket.IO broadcast...');
      const { broadcastMessage } = await import('@/lib/socketio-broadcaster.js');
      
      console.log('🔔 SERVER: Broadcasting via Socket.IO...');
      broadcastMessage(id, message);
      console.log('🔔 SERVER: ✅ Socket.IO broadcast successful');
      
    } catch (error) {
      console.error('🔔 SERVER: ❌ Error in Socket.IO broadcast:', error);
      console.error('🔔 SERVER: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
    
    // Also try the original pusherServer method
    try {
      console.log('🔔 SERVER: Attempting pusherServer broadcast...');
      await pusherServer.trigger(`conversation-${id}`, 'new-message', {
        message,
        conversationId: id,
      });
      
      // Also send to conversation-updates channel for conversation list updates
      await pusherServer.trigger('conversation-updates', 'new-message', {
        message,
        conversationId: id,
      });
      
      console.log('🔔 SERVER: ✅ PusherServer broadcast successful');
    } catch (error) {
      console.error('🔔 SERVER: ❌ Error in pusherServer broadcast:', error);
      console.error('🔔 SERVER: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
    
    console.log('🔔 SERVER: ========== REAL-TIME BROADCAST COMPLETED ==========');

    // Handle smart notifications for offline users
    try {
      // Get conversation details for notification
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { type: true, name: true }
      });

      if (conversation) {
        await MessageNotificationHandler.handleNewMessage({
          conversationId: id,
          messageId: message.id,
          senderId: session.user.id,
          senderName: message.sender.name,
          conversationName: conversation.name || 'Unknown',
          conversationType: conversation.type as 'direct' | 'group' | 'study_group',
          messageContent: message.content,
          messageType: message.type
        });
      }
    } catch (error) {
      console.error('Error handling message notifications:', error);
      // Don't fail the request if notification handling fails
    }

    console.log('🔔 SERVER: Returning response with message:', message.id);
    return NextResponse.json(message);
  } catch (error) {
    console.error('🔔 SERVER: Error sending message:', error);
    console.error('🔔 SERVER: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
