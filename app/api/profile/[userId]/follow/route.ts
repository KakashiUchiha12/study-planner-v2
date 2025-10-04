import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userId: targetUserId } = await params
    const currentUserId = (session.user as any).id

    // Prevent users from following themselves
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const prisma = dbService.getPrisma()

    // Check if follow relationship already exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        unique_follow: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: targetUserId }
    })

    return NextResponse.json({
      success: true,
      follow,
      followerCount
    })

  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userId: targetUserId } = await params
    const currentUserId = (session.user as any).id

    const prisma = dbService.getPrisma()

    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        unique_follow: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if (!existingFollow) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 400 })
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        unique_follow: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: targetUserId }
    })

    return NextResponse.json({
      success: true,
      followerCount
    })

  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
