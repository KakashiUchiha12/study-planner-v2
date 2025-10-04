import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileService } from '@/lib/database/file-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file size (max 250MB per file)
    const maxSize = 250 * 1024 * 1024
    for (const f of files) {
      if (f.size > maxSize) {
        return NextResponse.json({ error: `File ${f.name} exceeds 250MB` }, { status: 400 })
      }
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'users', userId, 'posts')
    await mkdir(uploadDir, { recursive: true })

    const results: any[] = []

    for (const file of files) {
      const ts = Date.now()
      const rand = Math.random().toString(36).slice(2)
      const ext = path.extname(file.name)
      const fileName = `${ts}-${rand}${ext}`
      const filePath = path.join(uploadDir, fileName)
      const buf = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buf)

      let thumbnailPath: string | null = null
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        // Reuse thumbnail generator; pass a virtual subjectId 'posts'
        thumbnailPath = await fileService.createThumbnail(filePath, fileName, 'posts', userId)
      }

      results.push({
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        url: `/uploads/users/${userId}/posts/${fileName}`,
        thumbnailUrl: thumbnailPath ? thumbnailPath.replace(process.cwd(), '') : undefined,
        mimeType: file.type,
        name: file.name,
        size: file.size,
      })
    }

    return NextResponse.json({ success: true, media: results })
  } catch (err) {
    console.error('Social upload error:', err)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}


