import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/database'
import { readFile } from 'fs/promises'
import { join } from 'path'
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

    // Check if thumbnail exists - try both the standard and high-quality versions
    let thumbnailPath = join(process.cwd(), 'uploads', 'thumbnails', `${documentId}-thumb.png`)
    
    // If standard thumbnail doesn't exist, try high-quality version
    if (!existsSync(thumbnailPath)) {
      thumbnailPath = join(process.cwd(), 'uploads', 'thumbnails', `${documentId}-thumb-hq.png`)
    }
    
    // If still no thumbnail, try to generate one
    if (!existsSync(thumbnailPath)) {
      console.log(`Thumbnail not found for ${documentId}, attempting to generate...`)
      
      try {
        // Get the document file path to generate thumbnail
        const filePath = await documentService.getDocumentFilePath(documentId)
        if (filePath) {
          await documentService.generateThumbnail(documentId, filePath, document.mimeType)
          
          // Check again for the generated thumbnail
          thumbnailPath = join(process.cwd(), 'uploads', 'thumbnails', `${documentId}-thumb.png`)
          if (!existsSync(thumbnailPath)) {
            thumbnailPath = join(process.cwd(), 'uploads', 'thumbnails', `${documentId}-thumb-hq.png`)
          }
        }
      } catch (genError) {
        console.error('Failed to generate thumbnail:', genError)
      }
    }

    if (!existsSync(thumbnailPath)) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    // Read and serve the thumbnail
    const thumbnailBuffer = await readFile(thumbnailPath)
    
    return new NextResponse(new Uint8Array(thumbnailBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('Error serving document thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id } = await params

    // Get the document to verify ownership
    const document = await documentService.getDocumentById(id)
    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the thumbnail data from request body
    const { thumbnailDataUrl } = await request.json()
    
    if (!thumbnailDataUrl || typeof thumbnailDataUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid thumbnail data' }, { status: 400 })
    }

    // Save the high-quality thumbnail to server
    const success = await documentService.saveClientGeneratedThumbnail(id, thumbnailDataUrl)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'High-quality thumbnail saved successfully' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to save thumbnail' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error saving client-generated thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
