import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/[id]/events - Get community events
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
    
    console.log('🔍 GET /api/communities/[id]/events - Fetching events for community:', id);

            const events = await communityService.getCommunityEvents(id, limit, offset, session.user.id);
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching community events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community events' },
      { status: 500 }
    );
  }
}
