import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fileService } from '@/lib/database/file-service'
import { readFile } from 'fs/promises'
import path from 'path'

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
    const { id: fileId } = await params

    const file = await fileService.getFileById(fileId, userId)

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if file exists on disk
    try {
      const fileBuffer = await readFile(file.filePath)
      
      // Increment download count
      await fileService.incrementDownloadCount(fileId)

      // Return file with appropriate headers
      const response = new NextResponse(fileBuffer as any)
      response.headers.set('Content-Type', file.mimeType)
      response.headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`)
      response.headers.set('Content-Length', file.fileSize.toString())
      
      return response

    } catch (fileError) {
      console.error('Error reading file from disk:', fileError)
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
