import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;

    // Get post with reactions and comments count
    const post = await dbService.getPrisma().post.findUnique({
      where: { id: postId },
      include: {
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Group reactions by type
    const reactionsByType: { [key: string]: any[] } = {};
    post.reactions.forEach(reaction => {
      if (!reactionsByType[reaction.type]) {
        reactionsByType[reaction.type] = [];
      }
      reactionsByType[reaction.type].push({
        id: reaction.user.id,
        name: reaction.user.name,
        image: reaction.user.image
      });
    });

    return NextResponse.json({
      commentsCount: post._count.comments,
      reactionsCount: post._count.reactions,
      reactions: reactionsByType
    });

  } catch (error) {
    console.error('Error fetching post stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
