import { NextRequest, NextResponse } from 'next/server'
import { goalService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: goalId } = await params
    const body = await request.json()
    
    // Convert dueDate string to Date object if present
    if (body.dueDate) {
      body.dueDate = new Date(body.dueDate)
    }

    const task = await goalService.addGoalTask(goalId, body)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error adding goal task:', error)
    return NextResponse.json(
      { error: 'Failed to add goal task' },
      { status: 500 }
    )
  }
}
