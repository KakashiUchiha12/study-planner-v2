import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';
import { pusherServer } from '@/lib/pusher';

// GET /api/messaging/messages/[id] - Get a specific message
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
    const prisma = dbService.getPrisma();
    const message = await prisma.message.findFirst({
      where: {
        id: id,
        deletedAt: null,
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
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

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

// PUT /api/messaging/messages/[id] - Update a message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check if user is the sender of the message
    const prisma = dbService.getPrisma();
    const message = await prisma.message.findFirst({
      where: {
        id: id,
        senderId: session.user.id,
        deletedAt: null,
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized to edit' },
        { status: 404 }
      );
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: {
        id: id,
      },
      data: {
        content: content.trim(),
        editedAt: new Date(),
        updatedAt: new Date(),
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

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`conversation-${message.conversationId}`, 'message-updated', {
      message: updatedMessage,
      conversationId: message.conversationId,
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if user is the sender of the message or admin of the conversation
    const prisma = dbService.getPrisma();
    const message = await prisma.message.findFirst({
      where: {
        id: id,
        deletedAt: null,
        OR: [
          {
            senderId: session.user.id,
          },
          {
            conversation: {
              participants: {
                some: {
                  userId: session.user.id,
                  role: 'admin',
                  isActive: true,
                },
              },
            },
          },
        ],
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized to delete' },
        { status: 404 }
      );
    }

    // Soft delete the message
    await prisma.message.update({
      where: {
        id: id,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`conversation-${message.conversationId}`, 'message-deleted', {
      messageId: id,
      conversationId: message.conversationId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
