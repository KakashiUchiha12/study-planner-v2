import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/database'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params

    // Get the document to verify it exists
    const document = await documentService.getDocumentById(documentId)
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Get the thumbnail data
    const thumbnailData = await documentService.getDocumentThumbnail(documentId)
    
    if (!thumbnailData) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      )
    }

    // Return the thumbnail as a proper image response
    return new NextResponse(thumbnailData.buffer, {
      headers: {
        'Content-Type': thumbnailData.mimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': thumbnailData.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error fetching thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    )
  }
}
