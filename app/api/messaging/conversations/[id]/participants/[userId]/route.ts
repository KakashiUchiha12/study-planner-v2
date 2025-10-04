import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// PUT /api/messaging/conversations/[id]/participants/[userId] - Update participant role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'moderator', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const prisma = dbService.getPrisma();

    // Check if the current user is a participant and has admin role
    const currentParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!currentParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (currentParticipant.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if the target participant exists
    const targetParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId,
        },
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Update the participant role
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId,
        },
      },
      data: { role },
    });

    // Fetch the updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id },
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
    console.error('Error updating participant role:', error);
    return NextResponse.json(
      { error: 'Failed to update participant role' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/conversations/[id]/participants/[userId] - Remove a participant from a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await params;
    const prisma = dbService.getPrisma();

    // Check if the current user is a participant and has admin role
    const currentParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!currentParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (currentParticipant.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if the target participant exists
    const targetParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId,
        },
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Don't allow removing the creator
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (conversation?.createdBy === userId) {
      return NextResponse.json({ error: 'Cannot remove the conversation creator' }, { status: 400 });
    }

    // Remove the participant
    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId,
        },
      },
    });

    // Fetch the updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id },
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
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}
