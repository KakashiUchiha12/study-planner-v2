import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionId: string = ''
  let body: any = {}
  let userId: string = ''
  
  try {
    // Test database connection first
    const dbTest = await dbService.testConnection()
    if (!dbTest.success) {
      console.error('🔍 API Study Sessions PUT: Database connection failed:', dbTest.error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: idParam } = await params
    sessionId = idParam
    body = await request.json()

    console.log('🔍 API: PUT request received for session:', sessionId)
    console.log('🔍 API: Request body:', body)
    console.log('🔍 API: User ID:', userId)

    // Verify the study session belongs to the user
    const existingSession = await dbService.getPrisma().studySession.findFirst({
      where: { id: sessionId, userId: userId }
    })

    if (!existingSession) {
      console.log('🔍 API: Session not found')
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    console.log('🔍 API: Existing session found:', {
      id: existingSession.id,
      currentEfficiency: existingSession.efficiency,
      currentTopics: existingSession.topicsCovered,
      currentMaterials: existingSession.materialsUsed
    })

    const updateData = {
      subjectId: body.subjectId || null,
      durationMinutes: body.durationMinutes,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      notes: body.notes || null,
      efficiency: body.efficiency !== undefined ? body.efficiency : null,
      sessionType: body.sessionType || null,
      productivity: body.productivity !== undefined ? body.productivity : null,
      topicsCovered: body.topicsCovered || null,
      materialsUsed: body.materialsUsed || null
    }

    console.log('🔍 API: Update data:', updateData)

    const updatedSession = await dbService.getPrisma().studySession.update({
      where: { id: sessionId },
      data: updateData
    })

    console.log('🔍 API: Session updated successfully:', {
      id: updatedSession.id,
      newEfficiency: updatedSession.efficiency,
      newTopics: updatedSession.topicsCovered,
      newMaterials: updatedSession.materialsUsed
    })

    // Serialize the response to prevent any potential serialization issues
    const serializedUpdatedSession = {
      ...updatedSession,
      startTime: updatedSession.startTime.toISOString(),
      endTime: updatedSession.endTime.toISOString(),
      createdAt: updatedSession.createdAt.toISOString()
    }

    return NextResponse.json(serializedUpdatedSession)
  } catch (error) {
    console.error('🔍 API: Detailed error in PUT:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      sessionId: sessionId,
      body: body,
      userId: userId
    })
    return NextResponse.json(
      { error: 'Failed to update study session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: sessionId } = await params

    // Verify the study session belongs to the user
    const existingSession = await dbService.getPrisma().studySession.findFirst({
      where: { id: sessionId, userId: userId }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    await dbService.getPrisma().studySession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete study session:', error)
    return NextResponse.json(
      { error: 'Failed to delete study session' },
      { status: 500 }
    )
  }
}
