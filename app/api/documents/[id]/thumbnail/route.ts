import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/database'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get thumbnail path
    const thumbnailPath = await documentService.getDocumentThumbnailPath(id)
    if (!thumbnailPath) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    // Read and serve the thumbnail file
    const fullPath = path.join(process.cwd(), thumbnailPath)
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Thumbnail file not found' }, { status: 404 })
    }

    const thumbnailBuffer = fs.readFileSync(fullPath)
    return new NextResponse(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving thumbnail:', error)
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
