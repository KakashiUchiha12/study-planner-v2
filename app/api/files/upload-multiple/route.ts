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
    
    const files = formData.getAll('files') as File[]
    const subjectId = formData.get('subjectId') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!files || files.length === 0 || !subjectId) {
      return NextResponse.json(
        { error: 'Files and subject ID are required' },
        { status: 400 }
      )
    }

    // Validate file count (max 20 files at once)
    if (files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files can be uploaded at once' },
        { status: 400 }
      )
    }

    // Validate file size (max 250MB per file)
    const maxSize = 250 * 1024 * 1024 // 250MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `File size too large. Maximum size is 250MB. Oversized files: ${oversizedFiles.map(f => f.name).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate file types - Allow all common file types
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

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `File type not allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : []

    // Process files sequentially to avoid overwhelming the server
    const results = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        console.log(`[Multiple Upload] Processing file ${i + 1}/${files.length}: ${file.name}`)
        
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

        results.push({
          success: true,
          file: {
            ...fileRecord,
            tags: parsedTags
          }
        })

        console.log(`[Multiple Upload] Successfully processed: ${file.name}`)
        
      } catch (error) {
        console.error(`[Multiple Upload] Error processing ${file.name}:`, error)
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Return results
    return NextResponse.json({
      success: results.length > 0,
      uploaded: results.length,
      total: files.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error uploading multiple files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
