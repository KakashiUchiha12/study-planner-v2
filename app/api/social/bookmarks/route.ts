import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { pusherServer } from '@/lib/pusher'

export async function GET(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const bookmarks = await prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ bookmarks })
}

export async function POST(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await request.json()
  const { postId } = body || {}
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  const created = await prisma.bookmark.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  })
  try {
    if (pusherServer) {
      await pusherServer.trigger(`post:${postId}`, 'bookmark:updated', { userId, postId, bookmarked: true })
    }
  } catch {}
  return NextResponse.json({ success: true, bookmark: created })
}

export async function DELETE(request: NextRequest) {
  const prisma = dbService.getPrisma()
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  await prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } })
  try {
    if (pusherServer) {
      await pusherServer.trigger(`post:${postId}`, 'bookmark:updated', { userId, postId, bookmarked: false })
    }
  } catch {}
  return NextResponse.json({ success: true })
}


