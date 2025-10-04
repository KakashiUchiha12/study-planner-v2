import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/[id]/members - Get community members
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const members = await communityService.getCommunityMembers(id, limit, offset);
    
    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching community members:', error);
    // Return empty members array to prevent fetch failures
    return NextResponse.json({ members: [] });
  }
}