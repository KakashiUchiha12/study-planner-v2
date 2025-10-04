import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database/database-service';

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

    const course = await dbService.prisma.course.findUnique({
      where: {
        id: courseId,
        isActive: true
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
            topics: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
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
            enrolledAt: true,
            topicProgress: {
              select: {
                topicId: true,
                isCompleted: true
              }
            }
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
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform course data
    const transformedCourse = {
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
      instructor: {
        id: course.createdByUser.id,
        name: course.createdByUser.name,
        image: course.createdByUser.image,
        bio: '' // TODO: Add bio to user profile
      },
      isEnrolled: course.enrollments.length > 0,
      progress: course.enrollments.length > 0 ? course.enrollments[0].progress : 0,
      chapters: course.chapters.map(chapter => {
        // Get user's progress for this course
        const userProgress = course.enrollments.length > 0 ? course.enrollments[0].topicProgress : [];
        const progressMap = new Map(userProgress.map(p => [p.topicId, p.isCompleted]));
        
        // Calculate chapter completion based on topic completion
        const chapterTopics = chapter.topics.map(topic => ({
          id: topic.id,
          title: topic.title,
          description: topic.description,
          type: topic.type,
          youtubeUrl: topic.youtubeUrl,
          content: topic.content,
          duration: topic.duration,
          isCompleted: progressMap.get(topic.id) || false
        }));
        
        // Chapter is completed if all topics are completed
        const isChapterCompleted = chapterTopics.length > 0 && chapterTopics.every(topic => topic.isCompleted);
        
        return {
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          duration: '', // TODO: Calculate duration from topics
          isCompleted: isChapterCompleted,
          topics: chapterTopics
        };
      }),
      createdAt: course.createdAt
    };

    return NextResponse.json(transformedCourse);

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if user is the course creator
    const course = await dbService.prisma.course.findUnique({
      where: { id: courseId },
      select: { createdBy: true }
    });

    if (!course || course.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this course' },
        { status: 403 }
      );
    }

    const { title, description, level, category, thumbnail, chapters } = body;

    // Update course basic information
    const updatedCourse = await dbService.prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        level,
        category,
        thumbnail,
        tags: JSON.stringify([])
      }
    });

    // Get existing chapters and topics to preserve progress
    const existingChapters = await dbService.prisma.courseChapter.findMany({
      where: { courseId },
      include: {
        topics: true
      },
      orderBy: { order: 'asc' }
    });

    // Create a map of existing chapters by their IDs for easy lookup
    const existingChapterMap = new Map(existingChapters.map(chapter => [chapter.id, chapter]));
    const existingTopicMap = new Map();
    existingChapters.forEach(chapter => {
      chapter.topics.forEach(topic => {
        existingTopicMap.set(topic.id, topic);
      });
    });

    // Process chapters - update existing ones and create new ones
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapterData = chapters[chapterIndex];
      const chapterOrder = chapterIndex + 1;

      let chapterId: string;

      if (chapterData.id && existingChapterMap.has(chapterData.id)) {
        // Update existing chapter
        const updatedChapter = await dbService.prisma.courseChapter.update({
          where: { id: chapterData.id },
          data: {
            title: chapterData.title,
            description: chapterData.description,
            order: chapterOrder
          }
        });
        chapterId = updatedChapter.id;
      } else {
        // Create new chapter
        const newChapter = await dbService.prisma.courseChapter.create({
          data: {
            courseId,
            title: chapterData.title,
            description: chapterData.description,
            order: chapterOrder
          }
        });
        chapterId = newChapter.id;
      }

      // Process topics for this chapter
      if (chapterData.topics && chapterData.topics.length > 0) {
        for (let topicIndex = 0; topicIndex < chapterData.topics.length; topicIndex++) {
          const topicData = chapterData.topics[topicIndex];
          const topicOrder = topicIndex + 1;

          if (topicData.id && existingTopicMap.has(topicData.id)) {
            // Update existing topic
            await dbService.prisma.courseTopic.update({
              where: { id: topicData.id },
              data: {
                title: topicData.title,
                description: topicData.description,
                type: topicData.type,
                content: topicData.content,
                youtubeUrl: topicData.youtubeUrl,
                duration: topicData.duration,
                order: topicOrder,
                chapterId: chapterId // Update chapter reference in case chapter was reordered
              }
            });
          } else {
            // Create new topic
            await dbService.prisma.courseTopic.create({
              data: {
                chapterId: chapterId,
                title: topicData.title,
                description: topicData.description,
                type: topicData.type,
                content: topicData.content,
                youtubeUrl: topicData.youtubeUrl,
                duration: topicData.duration,
                order: topicOrder
              }
            });
          }
        }
      }
    }

    // Delete chapters and topics that are no longer in the updated course
    const newChapterIds = chapters.map((chapter: any) => chapter.id).filter(Boolean);
    const newTopicIds = chapters.flatMap((chapter: any) => 
      chapter.topics ? chapter.topics.map((topic: any) => topic.id).filter(Boolean) : []
    );

    // Get all enrollments for this course to recalculate progress
    const enrollments = await dbService.prisma.courseEnrollment.findMany({
      where: { courseId, isActive: true }
    });

    // Delete topics that are no longer in the course
    const topicsToDelete = Array.from(existingTopicMap.keys()).filter(
      topicId => !newTopicIds.includes(topicId)
    );
    
    if (topicsToDelete.length > 0) {
      // Delete progress records for deleted topics first
      await dbService.prisma.courseProgress.deleteMany({
        where: {
          topicId: { in: topicsToDelete }
        }
      });
      
      // Then delete the topics
      await dbService.prisma.courseTopic.deleteMany({
        where: {
          id: { in: topicsToDelete }
        }
      });
    }

    // ALWAYS recalculate progress for all enrolled students after any course structure changes
    for (const enrollment of enrollments) {
      const totalTopics = await dbService.prisma.courseTopic.count({
        where: {
          chapter: { courseId }
        }
      });

      const completedTopics = await dbService.prisma.courseProgress.count({
        where: {
          enrollmentId: enrollment.id,
          isCompleted: true
        }
      });

      const newProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      await dbService.prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { progress: newProgress }
      });
    }

    // Delete chapters that are no longer in the course
    const chaptersToDelete = Array.from(existingChapterMap.keys()).filter(
      chapterId => !newChapterIds.includes(chapterId)
    );
    
    if (chaptersToDelete.length > 0) {
      await dbService.prisma.courseChapter.deleteMany({
        where: {
          id: { in: chaptersToDelete }
        }
      });
    }

    return NextResponse.json(updatedCourse);

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
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

    // Check if user is the course creator
    const course = await dbService.prisma.course.findUnique({
      where: { id: courseId },
      select: { createdBy: true }
    });

    if (!course || course.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this course' },
        { status: 403 }
      );
    }

    // Soft delete by setting isActive to false
    await dbService.prisma.course.update({
      where: { id: courseId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
