import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities - Get all communities with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const university = searchParams.get('university');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all communities (for now, we'll implement filtering later)
    const communities = await communityService.getAllCommunities({
      page,
      limit,
      search,
      category,
      subcategory,
      university
    });

    return NextResponse.json({
      communities,
      pagination: {
        page,
        limit,
        total: communities.length
      }
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

// POST /api/communities - Create a new community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, avatar, category, visibility } = body;

    if (!name || !slug || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const community = await communityService.createCommunity({
      name,
      slug,
      description,
      avatar,
      category,
      visibility: visibility || 'PUBLIC',
      ownerId: session.user.id
    });

    return NextResponse.json({ community }, { status: 201 });

  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
  }
}
