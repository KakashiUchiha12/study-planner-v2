import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { pusherServer } from '@/lib/pusher'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const reactions = await prisma.reaction.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Group reactions by type
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = []
      }
      acc[reaction.type].push(reaction.user.name)
      return acc
    }, {} as Record<string, string[]>)

    return NextResponse.json({ reactions: groupedReactions })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma()
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { postId, type } = body || {}
    
    if (!postId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Remove existing reaction from this user for this post
    await prisma.reaction.deleteMany({
      where: { postId, userId }
    })

    // Add new reaction
    const reaction = await prisma.reaction.create({
      data: { postId, userId, type },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Get updated reaction counts
    const allReactions = await prisma.reaction.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    const groupedReactions = allReactions.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = []
      }
      acc[r.type].push({
        id: r.user.id,
        name: r.user.name,
        image: r.user.image || null
      })
      return acc
    }, {} as Record<string, Array<{id: string, name: string, image: string | null}>>)

    // Trigger real-time update
    try {
      if (pusherServer) {
        await pusherServer.trigger(`post-${postId}`, 'reaction:updated', { 
          reactions: groupedReactions,
          userId,
          type 
        })
        console.log('Pusher event sent: reaction:updated for post:', postId)
      }
    } catch (error) {
      console.error('Failed to send Pusher event:', error)
    }

    // Create notification for post owner
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      });
      
      if (post && post.userId !== userId) {
        await NotificationService.createReactionNotification(
          post.userId,
          userId,
          type,
          postId
        );
      }
    } catch (error) {
      console.error('Failed to create reaction notification:', error);
    }

    return NextResponse.json({ success: true, reactions: groupedReactions })
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json({ error: 'Failed to create reaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const prisma = dbService.getPrisma()
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    await prisma.reaction.deleteMany({
      where: { postId, userId }
    })

    // Get updated reaction counts
    const allReactions = await prisma.reaction.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    const groupedReactions = allReactions.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = []
      }
      acc[r.type].push({
        id: r.user.id,
        name: r.user.name,
        image: r.user.image || null
      })
      return acc
    }, {} as Record<string, Array<{id: string, name: string, image: string | null}>>)

    // Trigger real-time update
    try {
      if (pusherServer) {
        await pusherServer.trigger(`post-${postId}`, 'reaction:updated', { 
          reactions: groupedReactions,
          userId,
          type: null 
        })
        console.log('Pusher event sent: reaction:updated for post:', postId)
      }
    } catch (error) {
      console.error('Failed to send Pusher event:', error)
    }

    return NextResponse.json({ success: true, reactions: groupedReactions })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json({ error: 'Failed to delete reaction' }, { status: 500 })
  }
}
