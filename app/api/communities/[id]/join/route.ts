import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// POST /api/communities/[id]/join - Join community
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
    
    // Check if user is already a member
    const isAlreadyMember = await communityService.isCommunityMember(id, session.user.id);
    
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }
    
    // Add user as member
    await communityService.addMember(id, session.user.id, 'MEMBER');
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    );
  }
}