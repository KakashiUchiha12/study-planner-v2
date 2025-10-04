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

    // Check if course exists and is published
    const course = await dbService.prisma.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
        isActive: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await dbService.prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        return NextResponse.json(
          { error: 'Already enrolled in this course' },
          { status: 400 }
        );
      } else {
        // Reactivate enrollment
        const enrollment = await dbService.prisma.courseEnrollment.update({
          where: {
            courseId_userId: {
              courseId,
              userId: session.user.id
            }
          },
          data: {
            isActive: true,
            enrolledAt: new Date()
          }
        });

        return NextResponse.json(enrollment);
      }
    }

    // Create new enrollment
    const enrollment = await dbService.prisma.courseEnrollment.create({
      data: {
        courseId,
        userId: session.user.id,
        enrolledAt: new Date()
      }
    });

    // Update course student count
    await dbService.prisma.course.update({
      where: { id: courseId },
      data: {
        studentCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json(enrollment);

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    // Check if user is enrolled
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

    // Deactivate enrollment
    await dbService.prisma.courseEnrollment.update({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id
        }
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    // Update course student count
    await dbService.prisma.course.update({
      where: { id: courseId },
      data: {
        studentCount: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error leaving course:', error);
    return NextResponse.json(
      { error: 'Failed to leave course' },
      { status: 500 }
    );
  }
}
