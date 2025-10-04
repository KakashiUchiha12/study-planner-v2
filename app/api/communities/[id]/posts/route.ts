import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { socialService } from '@/lib/database/social-service';

// GET /api/communities/[id]/posts - Get community posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const pageSize = 20;

    // Use socialService to fetch posts with proper formatting
    const posts = await socialService.listPosts({
      communityId,
      limit: pageSize,
      offset: cursor ? parseInt(cursor) : 0
    });

    // Apply cursor-based pagination
    let filteredPosts = posts;
    if (cursor) {
      const cursorTime = parseInt(cursor);
      filteredPosts = posts.filter(post => post.createdAt < cursorTime);
    }

    // Check if there are more posts
    const hasMore = filteredPosts.length >= pageSize;
    const pagedPosts = hasMore ? filteredPosts.slice(0, pageSize) : filteredPosts;
    
    // Get next cursor
    const nextCursor = pagedPosts.length > 0 ? pagedPosts[pagedPosts.length - 1].createdAt.toString() : null;

    return NextResponse.json({ 
      posts: pagedPosts,
      hasMore,
      nextCursor
    });

  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json({ 
      posts: [],
      hasMore: false,
      nextCursor: null
    });
  }
}

// POST /api/communities/[id]/posts - Create a new post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;
    const body = await request.json();
    const { title, content, type = 'text', tags } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the community
    const membership = await dbService.getPrisma().communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this community to create posts' },
        { status: 403 }
      );
    }

    // Create the post
    const post = await dbService.getPrisma().post.create({
      data: {
        communityId,
        authorId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        type,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}