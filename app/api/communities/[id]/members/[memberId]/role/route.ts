import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { dbService } from '@/lib/database';

// PUT /api/communities/[id]/members/[memberId]/role - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['ADMIN', 'MODERATOR', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, MODERATOR, or MEMBER' },
        { status: 400 }
      );
    }

    // Check if the current user has permission to change roles
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

    // Only admins and owners can change roles
    if (!['ADMIN', 'OWNER'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to change member roles' },
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

    // Prevent changing owner role
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      );
    }

    // Update the member role
    const updatedMember = await dbService.getPrisma().communityMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Member role updated successfully',
      member: updatedMember
    });

  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}