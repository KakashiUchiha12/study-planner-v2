import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/[id]/resources - Get community resources
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('🔍 GET /api/communities/[id]/resources - Fetching resources for community:', id);

    const resources = await communityService.getCommunityResources(id, limit, offset);
    
    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching community resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community resources' },
      { status: 500 }
    );
  }
}
