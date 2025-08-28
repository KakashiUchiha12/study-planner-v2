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
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: taskId } = await params
    const body = await request.json()

    // Verify the task belongs to the user
    const existingTask = await dbService.getPrisma().task.findFirst({
      where: { id: taskId, userId: userId }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await dbService.getPrisma().task.update({
      where: { id: taskId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.subjectId !== undefined && { subjectId: body.subjectId || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.timeSpent !== undefined && { timeSpent: body.timeSpent }),
        ...(body.order !== undefined && { order: Number(body.order) })
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedTask = {
      ...updatedTask,
      order: updatedTask.order ? updatedTask.order.toString() : '0'
    }

    return NextResponse.json(serializedTask)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
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
    let userId = session?.user?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: taskId } = await params

    // Verify the task belongs to the user
    const existingTask = await dbService.getPrisma().task.findFirst({
      where: { id: taskId, userId: userId }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await dbService.getPrisma().task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
