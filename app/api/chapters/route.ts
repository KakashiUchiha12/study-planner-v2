import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
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
    console.log('[Chapters API] POST request received')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      console.log('[Chapters API] Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('[Chapters API] User authenticated:', (session.user as any).id)

    const data: CreateChapterData = await request.json()
    console.log('[Chapters API] Request data:', data)
    
    // Validate required fields
    if (!data.subjectId || !data.title) {
      console.log('[Chapters API] Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Subject ID and title are required' },
        { status: 400 }
      )
    }

    console.log('[Chapters API] Calling chapterService.createChapter...')
    const chapter = await chapterService.createChapter(data)
    console.log('[Chapters API] Chapter created successfully:', chapter)
    
    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error('[Chapters API] Failed to create chapter:', error)
    console.error('[Chapters API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('[Chapters API] PATCH request received for reordering')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      console.log('[Chapters API] Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    console.log('[Chapters API] Reorder data:', data)
    
    // Validate required fields
    if (!data.subjectId || !data.chapterOrders || !Array.isArray(data.chapterOrders)) {
      console.log('[Chapters API] Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Subject ID and chapter orders array are required' },
        { status: 400 }
      )
    }

    console.log('[Chapters API] Calling chapterService.reorderChapters...')
    await chapterService.reorderChapters(data.subjectId, data.chapterOrders)
    console.log('[Chapters API] Chapters reordered successfully')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Chapters API] Failed to reorder chapters:', error)
    console.error('[Chapters API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to reorder chapters' },
      { status: 500 }
    )
  }
}
