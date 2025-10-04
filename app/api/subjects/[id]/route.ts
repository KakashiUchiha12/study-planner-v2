import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session using NextAuth's standard method
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      console.log('PUT /api/subjects/[id] - No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const subjectId = params.id
    console.log('PUT /api/subjects/[id] - User ID:', userId, 'Subject ID:', subjectId)

    const body = await request.json()
    
    // Check if the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: {
        id: subjectId,
        userId: userId
      }
    })

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found or access denied' },
        { status: 404 }
      )
    }

    // Update the subject
    const updatedSubject = await dbService.getPrisma().subject.update({
      where: {
        id: subjectId
      },
      data: {
        name: body.name,
        color: body.color,
        description: body.description,
        code: body.code,
        credits: body.credits,
        instructor: body.instructor,
        totalChapters: body.totalChapters,
        completedChapters: body.completedChapters,
        progress: body.progress,
        nextExam: body.nextExam ? new Date(body.nextExam) : null,
        assignmentsDue: body.assignmentsDue,
            visibility: 'public',
        order: body.order,
        updatedAt: new Date()
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedSubject = {
      ...updatedSubject,
      order: updatedSubject.order ? updatedSubject.order.toString() : '0'
    }

    return NextResponse.json(serializedSubject)
  } catch (error) {
    console.error('Failed to update subject:', error)
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session using NextAuth's standard method
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      console.log('DELETE /api/subjects/[id] - No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const subjectId = params.id
    console.log('DELETE /api/subjects/[id] - User ID:', userId, 'Subject ID:', subjectId)

    // Check if the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: {
        id: subjectId,
        userId: userId
      }
    })

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the subject
    await dbService.getPrisma().subject.delete({
      where: {
        id: subjectId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete subject:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}