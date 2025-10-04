import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/database'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: documentId } = await params

    // Verify the user has access to this document
    const document = await documentService.getDocumentById(documentId)
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get the thumbnail data from your document service
    // Note: Your method only takes documentId, not userId
    const thumbnail = await documentService.getDocumentThumbnail(documentId)
    
    if (!thumbnail) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      )
    }

    // Return the thumbnail as a proper image response
    return new NextResponse(thumbnail.buffer, {
      headers: {
        'Content-Type': thumbnail.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': thumbnail.buffer.length.toString(),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    )
  }
}