import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';
import { pusherServer } from '@/lib/pusher';

// GET /api/messaging/messages/[id]/reactions - Get reactions for a message
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

    // Check if user has access to the message
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
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const reactions = await prisma.messageReaction.findMany({
      where: {
        messageId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/messages/[id]/reactions - Add or remove a reaction
export async function POST(
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
    const { emoji } = body;

    // Validate required fields
    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    const prisma = dbService.getPrisma();

    // Check if user has access to the message
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
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: id,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove the reaction
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
    } else {
      // Add the reaction
      await prisma.messageReaction.create({
        data: {
          messageId: id,
          userId: session.user.id,
          emoji,
        },
      });
    }

    // Get updated reactions for the message
    const updatedReactions = await prisma.messageReaction.findMany({
      where: { messageId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`conversation-${message.conversationId}`, 'reaction-updated', {
      messageId: id,
      reactions: updatedReactions,
    });

    return NextResponse.json({ 
      action: existingReaction ? 'removed' : 'added', 
      emoji,
      reactions: updatedReactions 
    });
  } catch (error) {
    console.error('Error managing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to manage reaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/messages/[id]/reactions - Remove a reaction
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
    const body = await request.json();
    const { emoji } = body;

    // Validate required fields
    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    const prisma = dbService.getPrisma();

    // Check if user has access to the message
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
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Remove the reaction
    await prisma.messageReaction.deleteMany({
      where: {
        messageId: id,
        userId: session.user.id,
        emoji: emoji,
      },
    });

    // Fetch updated message with reactions
    const updatedMessage = await prisma.message.findUnique({
      where: { id: id },
      include: {
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
      },
    });

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`conversation-${message.conversationId}`, 'reaction-updated', {
      messageId: id,
      reactions: updatedMessage?.reactions || [],
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
