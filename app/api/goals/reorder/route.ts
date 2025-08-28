import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { goalIds } = await request.json()
    
    if (!Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: 'Invalid goal IDs provided' }, { status: 400 })
    }

    // Update the order of goals in the database
    const updates = goalIds.map((goalId: string, index: number) => 
      dbService.getPrisma().goal.update({
        where: { id: goalId, userId: userId },
        data: { order: index }
      })
    )

    await dbService.getPrisma().$transaction(updates)

    // Fetch updated goals to return
    const updatedGoals = await dbService.getPrisma().goal.findMany({
      where: { userId: userId },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedGoals)
  } catch (error) {
    console.error('Error reordering goals:', error)
    return NextResponse.json(
      { error: 'Failed to reorder goals' },
      { status: 500 }
    )
  }
}
