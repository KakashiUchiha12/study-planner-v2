import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, type } = await request.json();

    if (!commentId || !type) {
      return NextResponse.json({ error: 'Comment ID and reaction type are required' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Check if user already reacted to this comment
    const existingReaction = await dbService.getPrisma().commentReaction.findFirst({
      where: {
        commentId,
        userId,
      },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction if same type
        await dbService.getPrisma().commentReaction.delete({
          where: { id: existingReaction.id },
        });
      } else {
        // Update reaction type
        await dbService.getPrisma().commentReaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
      }
    } else {
      // Create new reaction
      await dbService.getPrisma().commentReaction.create({
        data: {
          commentId,
          userId,
          type,
        },
      });
    }

    // Get updated reactions
    const reactions = await dbService.getPrisma().commentReaction.findMany({
      where: { commentId },
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

    // Group reactions by type
    const reactionsByType: { [key: string]: any[] } = {};
    reactions.forEach(reaction => {
      if (!reactionsByType[reaction.type]) {
        reactionsByType[reaction.type] = [];
      }
      reactionsByType[reaction.type].push({
        id: reaction.user.id,
        name: reaction.user.name,
        image: reaction.user.image,
      });
    });

    return NextResponse.json({
      reactions: reactionsByType,
      totalReactions: reactions.length,
    });

  } catch (error) {
    console.error('Error handling comment reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
