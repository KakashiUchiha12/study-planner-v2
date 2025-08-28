import { NextRequest, NextResponse } from 'next/server'
import { goalService } from '@/lib/database'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const goals = await goalService.getUserGoals(userId)
    return NextResponse.json(goals)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    if (!body.title || !body.description || !body.targetDate || !body.category) {
      return NextResponse.json(
        { error: 'Title, description, target date, and category are required' },
        { status: 400 }
      )
    }

    // Convert targetDate string to Date object
    body.targetDate = new Date(body.targetDate)

    const goal = await goalService.createGoal(userId, body)
    return NextResponse.json(goal)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
