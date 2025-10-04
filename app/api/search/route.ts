import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'users'/'user', 'posts'/'post', 'subjects'/'subject', 'documents'/'document', 'materials'/'material', 'communities'/'community'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        message: 'Query must be at least 1 character long' 
      });
    }

    const searchQuery = query.trim();
    
    // Map singular types to plural types for API consistency
    const typeMapping: Record<string, string> = {
      'user': 'users',
      'post': 'posts', 
      'subject': 'subjects',
      'document': 'documents',
      'material': 'materials',
      'community': 'communities'
    };
    
    const normalizedType = typeMapping[type || ''] || type;
    
    const results: any = {
      users: [],
      posts: [],
      subjects: [],
      documents: [],
      materials: [],
      communities: []
    };

    // Search Users - More comprehensive search
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'users') {
      console.log('Searching users with query:', searchQuery);
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { email: { contains: searchQuery } },
            { profile: { 
              OR: [
                { fullName: { contains: searchQuery } },
                { bio: { contains: searchQuery } },
                { university: { contains: searchQuery } },
                { program: { contains: searchQuery } }
              ]
            }}
          ]
        },
        include: {
          profile: true,
          _count: {
            select: {
              posts: true,
              subjects: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' }
      });
      console.log('Found users:', users.length);
      results.users = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.profile?.bio,
        university: user.profile?.university,
        program: user.profile?.program,
        postsCount: user._count.posts,
        subjectsCount: user._count.subjects,
        type: 'user'
      }));
    }

    // Search Posts - More comprehensive search
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'posts') {
      console.log('Searching posts with query:', searchQuery);
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: searchQuery } },
            { tags: { contains: searchQuery } },
            { type: { contains: searchQuery } }
          ],
          visibility: {
            in: ['public', 'friends'] // Only search public/friends posts
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
              category: true,
              visibility: true,
            }
          },
          media: true,
          _count: {
            select: {
              comments: true,
              reactions: true,
              views: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Found posts:', posts.length);
      results.posts = posts.map(post => ({
        id: post.id,
        content: post.content,
        tags: post.tags,
        postType: post.type,
        createdAt: post.createdAt,
        user: post.user,
        community: post.community,
        media: post.media,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
        viewsCount: post._count.views,
        type: 'post'
      }));
    }

    // Search Subjects - More comprehensive search
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'subjects') {
      console.log('Searching subjects with query:', searchQuery);
      const subjects = await prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { code: { contains: searchQuery } },
            { instructor: { contains: searchQuery } }
          ],
          visibility: 'public' // Only search public subjects
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              chapters: true,
              materials: true,
              tasks: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' }
      });
      console.log('Found subjects:', subjects.length);
      results.subjects = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        code: subject.code,
        instructor: subject.instructor,
        color: subject.color,
        progress: subject.progress,
        user: subject.user,
        chaptersCount: subject._count.chapters,
        materialsCount: subject._count.materials,
        tasksCount: subject._count.tasks,
        type: 'subject'
      }));
    }

    // Search Documents - More comprehensive search
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'documents') {
      console.log('Searching documents with query:', searchQuery);
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { originalName: { contains: searchQuery } },
            { tags: { contains: searchQuery } },
            { type: { contains: searchQuery } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { uploadedAt: 'desc' }
      });
      console.log('Found documents:', documents.length);
      results.documents = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        originalName: doc.originalName,
        fileType: doc.type,
        mimeType: doc.mimeType,
        size: doc.size,
        tags: doc.tags,
        uploadedAt: doc.uploadedAt,
        user: doc.user,
        type: 'document'
      }));
    }

    // Search Materials - Only from Community Resources
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'materials') {
      console.log('Searching community resources with query:', searchQuery);
      const communityResources = await prisma.communityResource.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { type: { contains: searchQuery } },
            { tags: { contains: searchQuery } }
          ]
        },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              category: true,
              university: true,
              program: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Found community resources:', communityResources.length);
      results.materials = communityResources.map(resource => ({
        id: resource.id,
        title: resource.title,
        content: resource.description,
        materialType: resource.type,
        fileUrl: resource.filePath,
        fileName: resource.fileName,
        fileSize: resource.fileSize,
        mimeType: resource.mimeType,
        url: resource.url,
        media: resource.media,
        tags: resource.tags,
        isPinned: resource.isPinned,
        downloadCount: resource.downloadCount,
        community: resource.community,
        user: resource.createdByUser,
        createdAt: resource.createdAt,
        type: 'material'
      }));
    }

    // Search Communities - More comprehensive search
    if (!normalizedType || normalizedType === 'all' || normalizedType === 'communities') {
      console.log('Searching communities with query:', searchQuery);
      const communities = await prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { category: { contains: searchQuery } },
            { subcategory: { contains: searchQuery } },
            { university: { contains: searchQuery } },
            { program: { contains: searchQuery } },
            { tags: { contains: searchQuery } }
          ],
          visibility: 'public' // Only search public communities
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              members: true,
              posts: true,
              events: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Found communities:', communities.length);
      results.communities = communities.map((community: any) => ({
        id: community.id,
        name: community.name,
        description: community.description,
        category: community.category,
        subcategory: community.subcategory,
        university: community.university,
        program: community.program,
        year: community.year,
        avatar: community.avatar,
        banner: community.banner,
        tags: community.tags,
        visibility: community.visibility,
        joinType: community.joinType,
        owner: community.createdByUser,
        membersCount: community._count.members,
        postsCount: community._count.posts,
        eventsCount: community._count.events,
        type: 'community'
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    // If searching all types, combine and sort by relevance
    if (!normalizedType || normalizedType === 'all') {
      const allResults = [
        ...results.users.map((r: any) => ({ ...r, relevance: 1 })),
        ...results.posts.map((r: any) => ({ ...r, relevance: 2 })),
        ...results.subjects.map((r: any) => ({ ...r, relevance: 3 })),
        ...results.documents.map((r: any) => ({ ...r, relevance: 4 })),
        ...results.materials.map((r: any) => ({ ...r, relevance: 5 })),
        ...results.communities.map((r: any) => ({ ...r, relevance: 6 }))
      ];
      
      return NextResponse.json({
        results: allResults,
        total: totalResults,
        query: searchQuery,
        type: 'all'
      });
    }

    console.log('Returning search results:', { results, type: normalizedType, query: searchQuery });
    
    // For specific types, return the results for that type as an array
    const typeResults = results[normalizedType as keyof typeof results] || [];
    
    return NextResponse.json({
      results: typeResults,
      total: typeResults.length,
      query: searchQuery,
      type: normalizedType
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}