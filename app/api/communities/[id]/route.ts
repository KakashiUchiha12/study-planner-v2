import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/[id] - Get community by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const community = await communityService.getCommunityByIdentifier(id);
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ community });

  } catch (error) {
    console.error('Error fetching community:', error);
    // Return null community to show "not found" state
    return NextResponse.json({ community: null });
  }
}

// PUT /api/communities/[id] - Update community
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const community = await communityService.updateCommunity(id, session.user.id, body);
    
    return NextResponse.json({ community });

  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id] - Delete community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await communityService.deleteCommunity(id, session.user.id);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    );
  }
}