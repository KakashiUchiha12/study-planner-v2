import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// PUT /api/messaging/conversations/[id]/pin - Pin/unpin a conversation
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
    const { isPinned } = body;

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { error: 'isPinned must be a boolean' },
        { status: 400 }
      );
    }

    const prisma = dbService.getPrisma();

    // Check if user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Check pin limit (max 10 pinned conversations)
    if (isPinned) {
      const pinnedCount = await prisma.conversationParticipant.count({
        where: {
          userId: session.user.id,
          isPinned: true,
        },
      });

      if (pinnedCount >= 10) {
        return NextResponse.json(
          { error: 'You can only pin up to 10 conversations' },
          { status: 400 }
        );
      }
    }

    // Update the pin status
    const updatedParticipant = await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: {
        isPinned,
        pinnedAt: isPinned ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      isPinned: updatedParticipant.isPinned,
      pinnedAt: updatedParticipant.pinnedAt,
    });
  } catch (error) {
    console.error('Error updating pin status:', error);
    return NextResponse.json(
      { error: 'Failed to update pin status' },
      { status: 500 }
    );
  }
}
