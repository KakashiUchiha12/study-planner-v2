import { NextRequest, NextResponse } from 'next/server'
import { profileService } from '@/lib/database'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const profile = await profileService.getUserProfile(userId)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    if (!body.fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    const profile = await profileService.upsertUserProfile(userId, body)
    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error creating/updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    
    console.log('Updating profile for user:', userId, 'with data:', body)

    const profile = await profileService.updateUserProfile(userId, body)
    console.log('Profile updated successfully:', profile)
    
    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error updating profile:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
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
