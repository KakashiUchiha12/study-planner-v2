import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// POST /api/messaging/conversations/[id]/participants - Add a participant to a conversation
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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

    // Check if the user to be added exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is already a participant
    const existingParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: 'User is already a participant' }, { status: 400 });
    }

    // Add the participant
    await prisma.conversationParticipant.create({
      data: {
        conversationId: id,
        userId: userId,
        role: 'member',
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
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}