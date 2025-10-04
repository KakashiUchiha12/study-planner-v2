import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// GET /api/communities/[id]/members/me - Check if user is a member
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
    
    const isMember = await communityService.isCommunityMember(id, session.user.id);
    const userRole = await communityService.getUserRole(id, session.user.id);
    
    return NextResponse.json({ 
      isMember, 
      role: userRole 
    });

  } catch (error) {
    console.error('Error checking membership:', error);
    return NextResponse.json(
      { error: 'Failed to check membership' },
      { status: 500 }
    );
  }
}
