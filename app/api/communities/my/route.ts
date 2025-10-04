import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/my - Get user's communities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 GET /api/communities/my - Fetching user communities for:', session.user.id);

    const communities = await communityService.getUserCommunities(session.user.id);

    return NextResponse.json({ communities });
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user communities' },
      { status: 500 }
    );
  }
}
