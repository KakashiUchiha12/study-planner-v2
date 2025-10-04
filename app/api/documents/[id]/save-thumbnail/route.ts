import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { documentService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: documentId } = await params
    const { thumbnailDataUrl } = await request.json()

    if (!thumbnailDataUrl) {
      return NextResponse.json({ error: 'Thumbnail data is required' }, { status: 400 })
    }

    // Get document details to verify ownership
    const document = await documentService.getDocumentById(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Save the client-generated thumbnail
    const success = await documentService.saveClientGeneratedThumbnail(documentId, thumbnailDataUrl)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        thumbnailPath: `/api/documents/${documentId}/thumbnail`,
        message: 'High-quality thumbnail saved successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save thumbnail' 
      }, { status: 500 })
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('Error saving client-generated thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
