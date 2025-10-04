import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// POST /api/communities/[id]/leave - Leave community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if user is a member
    const isMember = await communityService.isCommunityMember(id, session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 400 });
    }
    
    // Remove user from community
    await communityService.removeMember(id, session.user.id);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error leaving community:', error);
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    );
  }
}
