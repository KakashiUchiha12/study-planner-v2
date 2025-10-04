import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            category: true,
            visibility: true,
          }
        },
        media: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            views: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has permission to view this post
    if (post.visibility === 'private' && post.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Track view
    try {
      await prisma.postView.create({
        data: {
          postId: post.id,
          userId: (session.user as any).id
        }
      });
    } catch (error) {
      // Ignore duplicate view errors
      console.log('View already tracked or error:', error);
    }

    return NextResponse.json({ post });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
