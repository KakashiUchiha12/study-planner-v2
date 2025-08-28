import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chapterService } from '@/lib/database'
import { CreateChapterData } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const chapters = await chapterService.getChaptersBySubjectId(subjectId)
    return NextResponse.json(chapters)
  } catch (error) {
    console.error('Failed to fetch chapters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data: CreateChapterData = await request.json()
    
    // Validate required fields
    if (!data.subjectId || !data.title || data.order === undefined) {
      return NextResponse.json(
        { error: 'Subject ID, title, and order are required' },
        { status: 400 }
      )
    }

    const chapter = await chapterService.createChapter(data)
    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error('Failed to create chapter:', error)
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}
