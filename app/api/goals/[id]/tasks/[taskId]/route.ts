import { NextRequest, NextResponse } from 'next/server'
import { goalService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: goalId, taskId } = await params
    const body = await request.json()
    
    // Convert dueDate string to Date object if present
    if (body.dueDate) {
      body.dueDate = new Date(body.dueDate)
    }

    const task = await goalService.updateGoalTask(taskId, body)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating goal task:', error)
    return NextResponse.json(
      { error: 'Failed to update goal task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskId } = await params
    await goalService.deleteGoalTask(taskId)
    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal task:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskId } = await params
    const task = await goalService.toggleGoalTask(taskId)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error toggling goal task:', error)
    return NextResponse.json(
      { error: 'Failed to toggle goal task' },
      { status: 500 }
    )
  }
}
