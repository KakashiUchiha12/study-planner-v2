import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const prisma = dbService.getPrisma()
    
    // Get user with profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return combined user and profile data
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Profile data (if exists)
      fullName: user.profile?.fullName || user.name,
      university: user.profile?.university || '',
      program: user.profile?.program || '',
      currentYear: user.profile?.currentYear || '',
      gpa: user.profile?.gpa || '',
      bio: user.profile?.bio || '',
      profilePicture: user.profile?.profilePicture || user.image,
      banner: user.profile?.banner || null
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    const prisma = dbService.getPrisma()
    const profile = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.fullName,
        email: body.email,
        image: body.profilePicture
      }
    })
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const body = await request.json()
    
    console.log('Updating profile for user:', userId, 'with data:', body)

    const prisma = dbService.getPrisma()
    
    // Validate required fields
    if (!body.fullName && !body.name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    
    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.fullName || body.name,
        email: body.email,
        image: body.profilePicture || body.image
      }
    })
    
    // Prepare profile data
    const updateData = {
      fullName: body.fullName || body.name,
      university: body.university || '',
      program: body.program || '',
      currentYear: body.currentYear || '',
      gpa: body.gpa || '',
      bio: body.bio || '',
      profilePicture: body.profilePicture || body.image,
      ...(body.banner !== undefined && { banner: body.banner })
    }

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: userId },
      update: updateData,
      create: {
        userId: userId,
        ...updateData
      }
    })
    
    // Return combined data
    const profileData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      fullName: updatedProfile.fullName,
      university: updatedProfile.university,
      program: updatedProfile.program,
      currentYear: updatedProfile.currentYear,
      gpa: updatedProfile.gpa,
      bio: updatedProfile.bio,
      profilePicture: updatedProfile.profilePicture,
      banner: updatedProfile.banner
    }
    
    console.log('Profile updated successfully:', profileData)
    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error updating profile:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code)
      console.error('Prisma error meta:', (error as any).meta)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update profile', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'profile_update_error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await profileService.deleteUserProfile(userId)
    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
