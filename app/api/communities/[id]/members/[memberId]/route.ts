import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { dbService } from '@/lib/database';

// DELETE /api/communities/[id]/members/[memberId] - Remove member from community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, memberId } = await params;

    // Check if the current user has permission to remove members
    const currentUserMembership = await dbService.getPrisma().communityMember.findFirst({
      where: {
        communityId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this community' },
        { status: 403 }
      );
    }

    // Get the target member
    const targetMember = await dbService.getPrisma().communityMember.findFirst({
      where: {
        id: memberId,
        communityId,
        status: 'active'
      }
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove community owner' },
        { status: 400 }
      );
    }

    // Users can remove themselves, or admins/owners can remove others
    const canRemove = targetMember.userId === session.user.id || 
                     ['ADMIN', 'OWNER'].includes(currentUserMembership.role);

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      );
    }

    // Remove the member
    await dbService.getPrisma().communityMember.update({
      where: { id: memberId },
      data: { status: 'inactive' }
    });

    return NextResponse.json({ 
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}