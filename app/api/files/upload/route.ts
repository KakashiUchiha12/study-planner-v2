import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { fileService } from '@/lib/database/file-service'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const subjectId = formData.get('subjectId') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!file || !subjectId) {
      return NextResponse.json(
        { error: 'File and subject ID are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 250MB)
    const maxSize = 250 * 1024 * 1024 // 250MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 250MB' },
        { status: 400 }
      )
    }

    // Validate file type - Allow all common file types
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'application/rtf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/xml',
      'text/xml',
      
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/ico',
      
      // Videos
      'video/mp4',
      'video/webm',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/mkv',
      'video/quicktime',
      
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp3',
      'audio/aac',
      'audio/flac',
      'audio/m4a',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      
      // Code files
      'text/javascript',
      'text/typescript',
      'text/css',
      'text/html',
      'application/javascript',
      'application/typescript',
      
      // Other common formats
      'application/octet-stream', // Generic binary files
      'application/x-binary',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${randomString}${fileExtension}`

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'uploads', userId, subjectId)
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, fileName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    // Create thumbnail if it's an image or PDF
    let thumbnailPath: string | null = null
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      thumbnailPath = await fileService.createThumbnail(filePath, fileName, subjectId, userId)
    }

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : []

    // Create file record in database
    const fileRecord = await fileService.createFile({
      userId,
      subjectId,
      fileName,
      originalName: file.name,
      fileType: path.extname(file.name).substring(1).toUpperCase(),
      mimeType: file.type,
      fileSize: file.size,
      filePath,
      thumbnailPath: thumbnailPath || undefined,
      category: category as any || fileService.getFileCategoryFromMimeType(file.type),
      tags: parsedTags,
      description: description || undefined,
      isPublic: isPublic || false
    })

    // Return success response
    return NextResponse.json({
      success: true,
      file: {
        ...fileRecord,
        tags: parsedTags
      }
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (subjectId) {
      const files = await fileService.getFilesBySubject(subjectId, userId)
      return NextResponse.json(files.map(file => ({
        ...file,
        tags: JSON.parse(file.tags)
      })))
    } else {
      const files = await fileService.getFilesByUser(userId)
      return NextResponse.json(files.map(file => ({
        ...file,
        tags: JSON.parse(file.tags)
      })))
    }

  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
