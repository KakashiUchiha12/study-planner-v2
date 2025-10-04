import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await request.json()
  const { postId, target, targetType } = body || {}
  if (!postId || !target || !targetType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const created = await prisma.share.create({ data: { postId, userId, target, targetType } })
  return NextResponse.json({ success: true, share: created })
}


