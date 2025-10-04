import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params

    const prisma = dbService.getPrisma()

    // Get followers with user details
    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profile: {
              select: {
                fullName: true,
                bio: true,
                university: true,
                program: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the data to include user info directly
    const followersList = followers.map(follow => ({
      id: follow.follower.id,
      name: follow.follower.name,
      username: follow.follower.username,
      image: follow.follower.image,
      fullName: follow.follower.profile?.fullName,
      bio: follow.follower.profile?.bio,
      university: follow.follower.profile?.university,
      program: follow.follower.profile?.program,
      followedAt: follow.createdAt
    }))

    return NextResponse.json({
      followers: followersList,
      count: followersList.length
    })

  } catch (error) {
    console.error('Error fetching followers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}
