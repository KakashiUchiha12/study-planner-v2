import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';

// PUT /api/communities/[id]/members/[memberId]/ban - Ban or unban member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, memberId } = await params;
    const { action } = await request.json(); // 'ban' or 'unban'
    
    console.log('🔍 PUT /api/communities/[id]/members/[memberId]/ban - Ban action:', { communityId, memberId, action });

    // Check if user has permission to ban/unban members
    const currentUserRole = await communityService.getUserRole(communityId, session.user.id);
    if (!currentUserRole || !['owner', 'admin', 'moderator'].includes(currentUserRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to ban/unban members' },
        { status: 403 }
      );
    }

    // Get the target member's current role
    const targetMemberRole = await communityService.getUserRole(communityId, memberId);
    if (!targetMemberRole) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent banning owners
    if (targetMemberRole === 'owner') {
      return NextResponse.json(
        { error: 'Cannot ban community owner' },
        { status: 403 }
      );
    }

    // Prevent moderators from banning admins
    if (currentUserRole === 'moderator' && ['admin', 'moderator'].includes(targetMemberRole)) {
      return NextResponse.json(
        { error: 'Moderators cannot ban admins or other moderators' },
        { status: 403 }
      );
    }

    // Prevent admins from banning other admins (only owners can)
    if (currentUserRole === 'admin' && targetMemberRole === 'admin') {
      return NextResponse.json(
        { error: 'Only owners can ban admins' },
        { status: 403 }
      );
    }

    // Ban or unban the member
    const newStatus = action === 'ban' ? 'banned' : 'active';
    const updatedMember = await communityService.updateMemberStatus(communityId, memberId, newStatus);

    return NextResponse.json({ 
      member: updatedMember,
      message: `Member ${action === 'ban' ? 'banned' : 'unbanned'} successfully`
    }, { status: 200 });
  } catch (error) {
    console.error('Error banning/unbanning member:', error);
    return NextResponse.json(
      { error: 'Failed to ban/unban member' },
      { status: 500 }
    );
  }
}
