import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get session using NextAuth's standard method
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      console.log('GET /api/subjects - No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    console.log('GET /api/subjects - User ID:', userId)

    const subjects = await dbService.getPrisma().subject.findMany({
      where: { userId: userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })

    // Convert BigInt to string for JSON serialization
    const serializedSubjects = subjects.map(subject => ({
      ...subject,
      order: subject.order ? subject.order.toString() : '0'
    }))

    return NextResponse.json(serializedSubjects)
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth's standard method
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      console.log('POST /api/subjects - No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    console.log('POST /api/subjects - User ID:', userId)

    const body = await request.json()
    
    // Get the current highest order value for this user
    const maxOrder = await dbService.getPrisma().subject.aggregate({
      where: { userId: userId },
      _max: { order: true }
    })
    
    const nextOrder = (maxOrder._max.order ? Number(maxOrder._max.order) : 0) + 1

    const subject = await dbService.getPrisma().subject.create({
      data: {
        id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        name: body.name,
        color: body.color || '#3B82F6',
        description: body.description || '',
        code: body.code || null,
        credits: body.credits || 3,
        instructor: body.instructor || null,
        totalChapters: body.totalChapters || 0,
        completedChapters: body.completedChapters || 0,
        progress: body.progress || 0.0,
        nextExam: body.nextExam ? new Date(body.nextExam) : null,
        assignmentsDue: body.assignmentsDue || 0,
        order: nextOrder
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedSubject = {
      ...subject,
      order: subject.order ? subject.order.toString() : '0'
    }

    return NextResponse.json(serializedSubject)
  } catch (error) {
    console.error('Failed to create subject:', error)
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    )
  }
}
