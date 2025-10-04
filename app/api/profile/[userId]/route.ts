import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

// GET /api/profile/[userId] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await dbService.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            posts: true,
            subjects: true,
            documents: true,
            tasks: true,
            goals: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get public posts
    const publicPosts = await dbService.prisma.post.findMany({
      where: {
        userId: userId,
        visibility: 'public',
      },
      include: {
        user: true,
        community: true,
        media: true,
        reactions: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get public subjects
    const publicSubjects = await dbService.prisma.subject.findMany({
      where: {
        userId: userId,
        visibility: 'public',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get public resources from communities
    const publicResources = await dbService.prisma.communityResource.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        community: true,
        createdByUser: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      user,
      publicPosts,
      publicSubjects,
      publicResources,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/[userId] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    
    // Check if user is updating their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = await dbService.prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await dbService.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}