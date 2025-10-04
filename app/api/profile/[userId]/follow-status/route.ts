import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId: targetUserId } = await params
    const currentUserId = session?.user ? (session.user as any).id : null

    const prisma = dbService.getPrisma()

    // Get follower and following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId }
      }),
      prisma.follow.count({
        where: { followerId: targetUserId }
      })
    ])

    // Check if current user is following this user (only if authenticated)
    let isFollowing = false
    if (currentUserId && currentUserId !== targetUserId) {
      const followRelationship = await prisma.follow.findUnique({
        where: {
          unique_follow: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      })
      isFollowing = !!followRelationship
    }

    return NextResponse.json({
      followerCount,
      followingCount,
      isFollowing
    })

  } catch (error) {
    console.error('Error getting follow status:', error)
    return NextResponse.json(
      { error: 'Failed to get follow status' },
      { status: 500 }
    )
  }
}
