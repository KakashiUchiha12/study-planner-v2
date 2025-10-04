import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  
  const body = await request.json()
  const { postId } = body || {}
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  // Get user ID if authenticated, otherwise use IP hash
  let userId: string | null = null
  let ipHash: string | null = null

  if (session?.user && (session.user as any).id) {
    userId = (session.user as any).id
  } else {
    // For anonymous users, hash their IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
  }

  try {
    // Try to create a view record (will fail if already exists due to unique constraint)
    await prisma.postView.create({
      data: {
        postId,
        userId,
        ipHash,
      },
    })
  } catch (error) {
    // Ignore unique constraint violations (user already viewed this post)
    if (!error.message?.includes('UNIQUE constraint failed')) {
      console.error('Error creating post view:', error)
    }
  }

  // Get total view count for this post
  const viewCount = await prisma.postView.count({
    where: { postId },
  })

  return NextResponse.json({ success: true, viewCount })
}

export async function GET(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const viewCount = await prisma.postView.count({
    where: { postId },
  })

  return NextResponse.json({ viewCount })
}
