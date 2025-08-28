import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fileService } from '@/lib/database/file-service'
import { readFile } from 'fs/promises'
import path from 'path'

export async function PUT(
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
    const { id: fileId } = await params
    const body = await request.json()

    const updatedFile = await fileService.updateFile(fileId, userId, {
      fileName: body.fileName,
      category: body.category,
      tags: body.tags,
      description: body.description,
      isPublic: body.isPublic
    })

    return NextResponse.json({
      success: true,
      file: {
        ...updatedFile,
        tags: JSON.parse(updatedFile.tags)
      }
    })

  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { id: fileId } = await params

    await fileService.deleteFile(fileId, userId)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

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

    // Read file from disk
    const filePath = file.filePath
    const fileBuffer = await readFile(filePath)
    
    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', file.mimeType)
    headers.set('Content-Disposition', `inline; filename="${file.originalName}"`)
    headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
