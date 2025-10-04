import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    return NextResponse.json(session.user)
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json(
      { error: 'Failed to get current user' },
      { status: 500 }
    )
  }
}
