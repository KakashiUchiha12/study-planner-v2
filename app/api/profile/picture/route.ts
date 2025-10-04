import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    console.log('Profile picture upload for user:', userId)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('File received:', { name: file.name, size: file.size, type: file.type })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size)
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', userId, 'profile')
    console.log('Uploads directory:', uploadsDir)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `profile-${timestamp}-${randomId}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    
    console.log('File path:', filePath)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('File saved successfully')

    // Generate relative path for database storage
    const relativePath = `/uploads/${userId}/profile/${fileName}`
    console.log('Relative path for database:', relativePath)

    // Update profile in database
    const prisma = dbService.getPrisma()
    
    // Update both User.image and UserProfile.profilePicture for consistency
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: relativePath }
    })
    
    // Also update or create UserProfile.profilePicture
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: userId },
      update: {
        profilePicture: relativePath
      },
      create: {
        userId: userId,
        fullName: updatedUser.name || 'User',
        profilePicture: relativePath
      }
    })
    
    console.log('User and profile updated in database:', { updatedUser, updatedProfile })

    return NextResponse.json({
      success: true,
      profilePicture: relativePath,
      profile: updatedProfile,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}
