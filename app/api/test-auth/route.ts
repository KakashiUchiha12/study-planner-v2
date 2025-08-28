import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AUTH ROUTE ===')
    
    // Test 1: Check environment variables
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    
    // Test 2: Try to get session
    try {
      const session = await getServerSession(authOptions)
      console.log('Session result:', session)
      console.log('User ID from session:', session?.user?.id)
      
      if (session?.user?.id) {
        return NextResponse.json({
          success: true,
          message: 'Authentication working',
          userId: session.user.id,
          user: session.user
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'No session found',
          session: session
        }, { status: 401 })
      }
    } catch (sessionError) {
      console.log('Session error:', sessionError)
      return NextResponse.json({
        success: false,
        message: 'Session error',
        error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.log('General error:', error)
    return NextResponse.json({
      success: false,
      message: 'General error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
