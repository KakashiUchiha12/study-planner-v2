import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fileService } from '@/lib/database/file-service'
import { readFile } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { id } = await params
    
    // Get file info from database
    const file = await fileService.getFileById(id, userId)
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this file
    if (file.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if thumbnail exists
    if (!file.thumbnailPath) {
      return NextResponse.json(
        { error: 'Thumbnail not available' },
        { status: 404 }
      )
    }

    // Read thumbnail from disk
    const thumbnailBuffer = await readFile(file.thumbnailPath)
    
    // Set appropriate headers for image
    const headers = new Headers()
    headers.set('Content-Type', 'image/png') // Thumbnails are saved as PNG
    headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    return new NextResponse(thumbnailBuffer as any, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error serving thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to serve thumbnail' },
      { status: 500 }
    )
  }
}
