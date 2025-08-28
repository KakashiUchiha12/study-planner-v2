import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chapterService } from '@/lib/database'
import { UpdateChapterData } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const chapterId = (await params).id
    const chapter = await chapterService.getChapterById(chapterId)
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Failed to fetch chapter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const chapterId = (await params).id
    const data: UpdateChapterData = await request.json()
    
    const chapter = await chapterService.updateChapter(chapterId, data)
    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Failed to update chapter:', error)
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const chapterId = (await params).id
    await chapterService.deleteChapter(chapterId)
    
    return NextResponse.json({ message: 'Chapter deleted successfully' })
  } catch (error) {
    console.error('Failed to delete chapter:', error)
    return NextResponse.json(
      { error: 'Failed to delete chapter' },
      { status: 500 }
    )
  }
}
