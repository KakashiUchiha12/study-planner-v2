import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { socialService } from '@/lib/database/social-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined
  const tag = searchParams.get('tag') || undefined
  const q = searchParams.get('q') || undefined
  const communityId = searchParams.get('communityId') || undefined
  const cursor = searchParams.get('cursor')

  const posts = await socialService.listPosts({ type, tag, q: q || undefined, communityId })
  // Simple cursor by createdAt (string timestamp)
  const sorted = posts.sort((a: any, b: any) => (b.createdAt as any) - (a.createdAt as any))
  const pageSize = 20
  let paged = sorted
  if (cursor) {
    const n = Number(cursor)
    paged = sorted.filter((p: any) => (p.createdAt as any) < n)
  }
  paged = paged.slice(0, pageSize)

  const normalized = paged.map(p => ({ ...p, reactions: (p as any).reactions || {} }))
  const hasMore = paged.length === pageSize
  const nextCursor = paged.length > 0 ? paged[paged.length - 1].createdAt : null
  
  return NextResponse.json({ 
    posts: normalized, 
    hasMore, 
    nextCursor 
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const payload = await request.json()
  const { content, tags, communityId, media } = payload || {}

  const created = await socialService.createPost({
    userId,
    content,
    tags,
    communityId,
    media,
  })

  const posts = await socialService.listPosts()
  const post = posts.find(p => p.id === created.id)
  const normalized = post ? { ...post, reactions: post.reactions || {} } : post
  return NextResponse.json({ success: true, post: normalized })
}


