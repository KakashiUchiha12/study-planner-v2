import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      isPublished: true,
      isActive: true
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (level && level !== 'all') {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    const courses = await dbService.prisma.course.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        chapters: {
          select: {
            id: true
          }
        },
        enrollments: {
          where: {
            userId: session.user.id,
            isActive: true
          },
          select: {
            id: true,
            progress: true,
            enrolledAt: true
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform courses to include enrollment status and progress
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      level: course.level,
      category: course.category,
      tags: course.tags ? JSON.parse(course.tags) : [],
      duration: course.duration,
      rating: course.rating,
      studentCount: course._count.enrollments,
      chapters: course.chapters.length,
      instructor: {
        id: course.createdByUser.id,
        name: course.createdByUser.name,
        image: course.createdByUser.image
      },
      isEnrolled: course.enrollments.length > 0,
      progress: course.enrollments.length > 0 ? course.enrollments[0].progress : 0,
      createdAt: course.createdAt
    }));

    return NextResponse.json({
      courses: transformedCourses,
      total: transformedCourses.length
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, level, category, thumbnail, chapters } = body;

    if (!title || !description || !level || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create course with chapters and topics
    const course = await dbService.prisma.course.create({
      data: {
        title,
        description,
        level,
        category,
        thumbnail,
        tags: JSON.stringify([]),
        isPublished: true, // Auto-publish created courses
        createdBy: session.user.id,
        chapters: {
          create: chapters.map((chapter: any, chapterIndex: number) => ({
            title: chapter.title,
            description: chapter.description,
            order: chapterIndex + 1,
            topics: {
              create: chapter.topics.map((topic: any, topicIndex: number) => ({
                title: topic.title,
                description: topic.description,
                type: topic.type,
                content: topic.content,
                youtubeUrl: topic.youtubeUrl,
                duration: topic.duration,
                order: topicIndex + 1
              }))
            }
          }))
        }
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        chapters: {
          include: {
            topics: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json(course);

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
