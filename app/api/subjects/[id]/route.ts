import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for updating subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = await params
    const body = await request.json()

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Merge existing data with updates to prevent data loss
    const updatedSubject = await dbService.getPrisma().subject.update({
      where: { id: subjectId },
      data: {
        ...existingSubject, // Start with existing data
        ...body,            // Overlay with provided updates
        // Ensure specific types/formats if needed
        nextExam: body.nextExam ? new Date(body.nextExam) : (body.nextExam === null ? null : existingSubject.nextExam),
        // Ensure order is handled correctly, as it's a specific update
        order: body.order !== undefined ? body.order : existingSubject.order
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for deleting subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = await params

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    await dbService.getPrisma().subject.delete({
      where: { id: subjectId }
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for updating subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = await params
    const body = await request.json()

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Update chapter progress
    const updatedSubject = await dbService.getPrisma().subject.update({
      where: { id: subjectId },
      data: {
        totalChapters: body.totalChapters,
        completedChapters: body.completedChapters,
        progress: body.progress
      }
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Failed to update subject progress:', error)
    return NextResponse.json(
      { error: 'Failed to update subject progress' },
      { status: 500 }
    )
  }
}
