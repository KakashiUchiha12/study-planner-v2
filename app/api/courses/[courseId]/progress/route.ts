import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await request.json();
    const { topicId, isCompleted, timeSpent } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await dbService.prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id
        }
      }
    });

    if (!enrollment || !enrollment.isActive) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if topic exists and belongs to the course
    const topic = await dbService.prisma.courseTopic.findFirst({
      where: {
        id: topicId,
        chapter: {
          courseId
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update or create progress record
    const progress = await dbService.prisma.courseProgress.upsert({
      where: {
        enrollmentId_topicId: {
          enrollmentId: enrollment.id,
          topicId
        }
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        timeSpent: timeSpent || 0
      },
      create: {
        enrollmentId: enrollment.id,
        topicId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        timeSpent: timeSpent || 0
      }
    });

    // Calculate overall course progress
    const totalTopics = await dbService.prisma.courseTopic.count({
      where: {
        chapter: {
          courseId
        }
      }
    });

    const completedTopics = await dbService.prisma.courseProgress.count({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true
      }
    });

    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    // Update enrollment progress
    await dbService.prisma.courseEnrollment.update({
      where: {
        id: enrollment.id
      },
      data: {
        progress: overallProgress,
        completedAt: overallProgress === 100 ? new Date() : null
      }
    });

    return NextResponse.json({
      progress,
      overallProgress
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    // Check if user is enrolled in the course
    const enrollment = await dbService.prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id
        }
      }
    });

    if (!enrollment || !enrollment.isActive) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    // Get all progress records for this enrollment
    const progress = await dbService.prisma.courseProgress.findMany({
      where: {
        enrollmentId: enrollment.id
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      enrollment,
      progress
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
