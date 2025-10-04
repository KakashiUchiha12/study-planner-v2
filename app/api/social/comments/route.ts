import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { pusherServer } from '@/lib/pusher'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  const cursor = searchParams.get('cursor')
  
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  
  const pageSize = 10
  const whereClause: any = { postId }
  
  if (cursor) {
    whereClause.createdAt = { gt: new Date(cursor) }
  }
  
  // Get all comments for the post
  const allComments = await prisma.comment.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })
  
  // Build nested structure
  const commentMap = new Map()
  const rootComments: any[] = []
  
  // First pass: create comment objects
  allComments.forEach(comment => {
    commentMap.set(comment.id, {
      ...comment,
      replies: []
    })
  })
  
  // Second pass: build hierarchy
  allComments.forEach(comment => {
    const commentObj = commentMap.get(comment.id)
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId)
      if (parent) {
        parent.replies.push(commentObj)
      }
    } else {
      rootComments.push(commentObj)
    }
  })
  
  // Apply pagination to root comments only
  const paginatedRootComments = cursor 
    ? rootComments.filter(c => c.createdAt > new Date(cursor))
    : rootComments
  
  const hasMore = paginatedRootComments.length > pageSize
  const result = hasMore ? paginatedRootComments.slice(0, pageSize) : paginatedRootComments
  const nextCursor = hasMore ? result[result.length - 1]?.createdAt : null
  
  return NextResponse.json({ 
    comments: result, 
    hasMore, 
    nextCursor: nextCursor?.toISOString() 
  })
}

export async function POST(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await request.json()
  const { postId, content, parentCommentId } = body || {}
  if (!postId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const created = await prisma.comment.create({
    data: { postId, userId, content, parentCommentId: parentCommentId || null },
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
  })

  // Detect mentions in comment content
  const mentionMatches = content.match(/@(\w+)/g);
  if (mentionMatches) {
    for (const mention of mentionMatches) {
      const username = mention.substring(1); // Remove @
      
      // Find user by username (you might need to adjust this based on your user model)
      const mentionedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: username } },
            { email: { contains: username } }
          ]
        },
        select: { id: true }
      });

      if (mentionedUser) {
        // Create mention notification
        await NotificationService.createMentionNotification(
          mentionedUser.id,
          userId,
          postId,
          created.id
        );
      }
    }
  }

  // Create comment notification for post owner
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true }
  });

  if (post) {
    await NotificationService.createCommentNotification(
      post.userId,
      userId,
      created.id,
      postId
    );
  }

  try {
    if (pusherServer) {
      await pusherServer.trigger(`post-${postId}`, 'comment:created', { comment: created })
      console.log('Pusher event sent: comment:created for post:', postId)
    }
  } catch (error) {
    console.error('Failed to send Pusher event:', error)
  }


  return NextResponse.json({ success: true, comment: created })
}

export async function PUT(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  const userId = (session.user as any).id
  const body = await request.json()
  const { commentId, content } = body || {}
  
  if (!commentId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  
  // Check if user owns the comment
  const existingComment = await prisma.comment.findFirst({
    where: { id: commentId, userId }
  })
  
  if (!existingComment) {
    return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
  }
  
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { 
      content
    },
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
  })
  
  console.log('Updated comment:', {
    id: updated.id,
    content: updated.content,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    isEdited: updated.updatedAt > updated.createdAt
  });
  
  try {
    if (pusherServer) {
      await pusherServer.trigger(`post:${updated.postId}`, 'comment:updated', { comment: updated })
      console.log('Pusher event sent: comment:updated for post:', updated.postId)
    }
  } catch (error) {
    console.error('Failed to send Pusher event:', error)
  }
  
  return NextResponse.json({ success: true, comment: updated })
}

export async function DELETE(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  const userId = (session.user as any).id
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('commentId')
  
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })
  
  // Check if user owns the comment
  const existingComment = await prisma.comment.findFirst({
    where: { id: commentId, userId }
  })
  
  if (!existingComment) {
    return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
  }
  
  await prisma.comment.delete({
    where: { id: commentId }
  })
  
  try {
    if (pusherServer) {
      await pusherServer.trigger(`post:${existingComment.postId}`, 'comment:deleted', { commentId })
      console.log('Pusher event sent: comment:deleted for post:', existingComment.postId)
    }
  } catch (error) {
    console.error('Failed to send Pusher event:', error)
  }
  
  return NextResponse.json({ success: true })
}


