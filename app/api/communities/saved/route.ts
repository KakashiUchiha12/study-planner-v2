import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

// GET /api/communities/saved - Get user's saved communities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    console.log('🔍 GET /api/communities/saved - Fetching saved communities for user:', userId);

    // Get saved communities with pagination
    const savedCommunities = await dbService.getPrisma().savedCommunity.findMany({
      where: {
        userId,
      },
      include: {
        community: {
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await dbService.getPrisma().savedCommunity.count({
      where: {
        userId,
      },
    });

    // Transform the data to match the expected format
    const communities = savedCommunities.map((saved) => ({
      ...saved.community,
      memberCount: saved.community._count.members,
      _count: saved.community._count,
      savedAt: saved.createdAt,
    }));

    return NextResponse.json({
      communities,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching saved communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved communities' },
      { status: 500 }
    );
  }
}
