import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', userId, 'banner')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `banner_${timestamp}.${fileExtension}`
    const filepath = join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the relative path for storage in database
    const relativePath = `/uploads/${userId}/banner/${filename}`

    // Update user profile with new banner path
    const prisma = dbService.getPrisma()
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: userId },
      update: { banner: relativePath },
      create: { userId: userId, fullName: session.user.name || 'User', banner: relativePath },
    })

    return NextResponse.json({ 
      banner: relativePath,
      message: 'Banner uploaded successfully' 
    })

  } catch (error) {
    console.error('Error uploading banner:', error)
    return NextResponse.json(
      { error: 'Failed to upload banner' },
      { status: 500 }
    )
  }
}
