import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/database'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
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

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `inline; filename="${document.name}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })

  } catch (error) {
    console.error('Error serving document file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
