import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    const dbTest = await dbService.testConnection()
    if (!dbTest.success) {
      console.error('🔍 API Study Sessions GET: Database connection failed:', dbTest.error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    console.log('🔍 API Study Sessions GET: Session:', !!session, 'UserId:', userId)

    // Require authentication
    if (!userId) {
      console.log('🔍 API Study Sessions GET: No userId, returning 401')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const sessionType = searchParams.get('sessionType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('🔍 API Study Sessions GET: Query params:', { subjectId, sessionType, startDate, endDate })

    const where: any = { userId: userId }
    if (subjectId && subjectId !== 'all') where.subjectId = subjectId
    if (sessionType && sessionType !== 'all') where.sessionType = sessionType
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    console.log('🔍 API Study Sessions GET: Database query where clause:', where)

    const studySessions = await dbService.getPrisma().studySession.findMany({
      where,
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    })

    console.log('🔍 API Study Sessions GET: Found sessions:', studySessions.length)

    // Serialize BigInt fields to prevent JSON serialization errors
    const serializedStudySessions = studySessions.map(session => ({
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      createdAt: session.createdAt.toISOString(),
      subject: session.subject ? {
        ...session.subject,
        order: session.subject.order ? session.subject.order.toString() : '0',
        createdAt: session.subject.createdAt.toISOString(),
        updatedAt: session.subject.updatedAt.toISOString(),
        nextExam: session.subject.nextExam ? session.subject.nextExam.toISOString() : null
      } : null
    }))

    return NextResponse.json(serializedStudySessions)
  } catch (error) {
    console.error('🔍 API Study Sessions GET: Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let body: any = {}
  let userId: string = ''
  
  try {
    // Test database connection first
    const dbTest = await dbService.testConnection()
    if (!dbTest.success) {
      console.error('🔍 API Study Sessions POST: Database connection failed:', dbTest.error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    userId = (session?.user as any)?.id

    // Require authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    body = await request.json()
    
    const studySession = await dbService.getPrisma().studySession.create({
      data: {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        subjectId: body.subjectId || null,
        durationMinutes: body.durationMinutes,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.notes || null,
        efficiency: body.efficiency !== undefined ? body.efficiency : null,
        sessionType: body.sessionType || null,
        productivity: body.productivity || null,
        topicsCovered: body.topicsCovered || null,
        materialsUsed: body.materialsUsed || null
      }
    })

    // Serialize the response to prevent any potential serialization issues
    const serializedStudySession = {
      ...studySession,
      startTime: studySession.startTime.toISOString(),
      endTime: studySession.endTime.toISOString(),
      createdAt: studySession.createdAt.toISOString()
    }

    return NextResponse.json(serializedStudySession)
  } catch (error) {
    console.error('🔍 API Study Sessions POST: Detailed error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      body: body,
      userId: userId
    })
    return NextResponse.json(
      { error: 'Failed to create study session' },
      { status: 500 }
    )
  }
}
