import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const documentId = (await params).id

    // Get document details
    const document = await documentService.getDocumentById(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the document file path
    const filePath = await documentService.getDocumentFilePath(documentId)
    if (!filePath) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 })
    }

    // Regenerate thumbnail
    const thumbnailPath = await documentService.generateThumbnail(documentId, filePath, document.mimeType)
    
    if (thumbnailPath) {
      return NextResponse.json({ 
        success: true, 
        thumbnailPath: `/api/documents/${documentId}/thumbnail`,
        message: 'Thumbnail regenerated successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate thumbnail' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error regenerating document thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
