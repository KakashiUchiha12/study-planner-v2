import { NextRequest, NextResponse } from 'next/server'
import { goalService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
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
    const goal = await goalService.getGoalById(goalId)
    
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Check if the goal belongs to the authenticated user
    if (goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    
    // Validate request body
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }
    
    // Convert targetDate string to Date object if present
    if (body.targetDate) {
      body.targetDate = new Date(body.targetDate)
    }

    const goal = await goalService.updateGoal(goalId, body)
    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: goalId } = await params
    await goalService.deleteGoal(goalId)
    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
