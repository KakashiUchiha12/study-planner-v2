import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// GET /api/messaging/conversations - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = dbService.getPrisma();
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
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
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform the data to include unread count and last message
    const transformedConversations = await Promise.all(conversations.map(async (conversation) => {
      const currentUserParticipant = conversation.participants.find(
        (p) => p.userId === session.user.id
      );
      
      const lastMessage = conversation.messages[0];
      
      // Calculate actual unread count based on lastReadAt
      let unreadCount = 0;
      if (currentUserParticipant?.lastReadAt) {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            createdAt: {
              gt: new Date(currentUserParticipant.lastReadAt),
            },
            deletedAt: null,
          },
        });
      } else {
        // If no lastReadAt, count all messages
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            deletedAt: null,
          },
        });
      }

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        description: conversation.description,
        avatar: conversation.avatar,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender,
        } : null,
        unreadCount,
        isPinned: currentUserParticipant?.isPinned || false,
        pinnedAt: currentUserParticipant?.pinnedAt,
        participants: conversation.participants.map((p) => ({
          id: p.id,
          role: p.role,
          joinedAt: p.joinedAt,
          lastReadAt: p.lastReadAt,
          isPinned: p.isPinned,
          pinnedAt: p.pinnedAt,
          user: p.user,
        })),
        createdBy: conversation.createdByUser,
      };
    }));

    // Sort conversations: pinned first, then by updatedAt
    const sortedConversations = transformedConversations.sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Within pinned/unpinned groups, sort by updatedAt
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(sortedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Return empty result instead of error to prevent fetch failures
    return NextResponse.json([]);
  }
}

// POST /api/messaging/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/messaging/conversations - Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('🔍 POST /api/messaging/conversations - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 POST /api/messaging/conversations - Session valid, user ID:', session.user.id);

    const body = await request.json();
    const { type, name, description, participantIds } = body;
    
    console.log('🔍 POST /api/messaging/conversations - Request body:', { type, name, description, participantIds });

    // Validate required fields
    if (!type || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'Type and participantIds are required' },
        { status: 400 }
      );
    }

    // For direct messages, ensure only 2 participants (including creator)
    if (type === 'direct' && participantIds.length !== 1) {
      return NextResponse.json(
        { error: 'Direct messages must have exactly 2 participants' },
        { status: 400 }
      );
    }

    // For group chats, ensure we have a name and at least 2 participants (including creator)
    if (type === 'group' && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Groups can be created with no additional participants (just the creator)
    // No validation needed for participantIds.length for groups

    console.log('🔍 POST /api/messaging/conversations - Getting Prisma client');
    const prisma = dbService.getPrisma();
    console.log('🔍 POST /api/messaging/conversations - Prisma client obtained');

    // Check if direct conversation already exists
    if (type === 'direct') {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'direct',
          AND: [
            {
              participants: {
                some: {
                  userId: session.user.id,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: participantIds[0],
                },
              },
            },
          ],
        },
        include: {
          participants: {
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
          createdByUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }
    }

    // Create the conversation
    console.log('🔍 POST /api/messaging/conversations - Creating conversation');
    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: type !== 'direct' ? name : null,
        description: type !== 'direct' ? description : null,
        createdBy: session.user.id,
      },
      include: {
        participants: {
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    console.log('🔍 POST /api/messaging/conversations - Conversation created:', conversation.id);

    // Add participants separately to avoid unique constraint issues
    const allParticipantIds = [session.user.id, ...participantIds];
    
    // Remove duplicates to avoid unique constraint violations
    const uniqueParticipantIds = [...new Set(allParticipantIds)];
    
    const participantsToCreate = uniqueParticipantIds.map((userId) => ({
      conversationId: conversation.id,
      userId,
      role: userId === session.user.id ? 'admin' : 'member',
    }));

    console.log('🔍 POST /api/messaging/conversations - Creating participants:', participantsToCreate);
    
    try {
      await prisma.conversationParticipant.createMany({
        data: participantsToCreate,
      });
      console.log('🔍 POST /api/messaging/conversations - Participants created successfully');
    } catch (participantError) {
      console.error('🔍 POST /api/messaging/conversations - Error creating participants:', participantError);
      // If participant creation fails, clean up the conversation
      await prisma.conversation.delete({
        where: { id: conversation.id }
      });
      throw participantError;
    }

    // Fetch the conversation with all participants
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: { type: body?.type, name: body?.name, description: body?.description, participantIds: body?.participantIds }
    });
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
