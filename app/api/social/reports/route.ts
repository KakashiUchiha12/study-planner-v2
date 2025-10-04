import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, postId, reason, type } = await request.json();

    if (!reason || !type) {
      return NextResponse.json({ error: 'Reason and type are required' }, { status: 400 });
    }

    if (type === 'comment' && !commentId) {
      return NextResponse.json({ error: 'Comment ID is required for comment reports' }, { status: 400 });
    }

    if (type === 'post' && !postId) {
      return NextResponse.json({ error: 'Post ID is required for post reports' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Check if user already reported this content
    const existingReport = await dbService.getPrisma().report.findFirst({
      where: {
        reporterId: userId,
        ...(type === 'comment' ? { commentId } : { postId }),
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 400 });
    }

    // Create report
    const report = await dbService.getPrisma().report.create({
      data: {
        reporterId: userId,
        reason,
        type,
        ...(type === 'comment' ? { commentId } : { postId }),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully',
      reportId: report.id 
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
