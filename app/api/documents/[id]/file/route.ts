import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { documentService } from '@/lib/database'

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const documentId = (await params).id

    // Get document details first
    const document = await documentService.getDocumentById(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the full file path
    const filePath = await documentService.getDocumentFilePath(documentId)
    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = await readFile(filePath)

    // Check if this is a download request
    const url = new URL(request.url)
    const isDownload = url.searchParams.get('download') === 'true'

    // Return the file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': isDownload 
          ? `attachment; filename="${document.originalName || document.name}"` 
          : `inline; filename="${document.name}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('Error serving document file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
