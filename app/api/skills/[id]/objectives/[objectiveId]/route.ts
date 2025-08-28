import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { skillService } from '@/lib/database'

// PUT /api/skills/[id]/objectives/[objectiveId] - Update an objective
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: skillId, objectiveId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Update the objective
    const objective = await skillService.updateSkillObjective(objectiveId, {
      title: body.title,
      description: body.description || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      order: body.order || 0
    })

    return NextResponse.json(objective)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error updating skill objective:', error)
    return NextResponse.json(
      { error: 'Failed to update skill objective' },
      { status: 500 }
    )
  }
}

// DELETE /api/skills/[id]/objectives/[objectiveId] - Delete an objective
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: skillId, objectiveId } = await params

    // Delete the objective
    await skillService.deleteSkillObjective(objectiveId)

    return NextResponse.json({ message: 'Objective deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error deleting skill objective:', error)
    return NextResponse.json(
      { error: 'Failed to delete skill objective' },
      { status: 500 }
    )
  }
}

// PATCH /api/skills/[id]/objectives/[objectiveId] - Toggle objective completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: skillId, objectiveId } = await params
    const body = await request.json()

    // Toggle the objective completion
    const objective = await skillService.toggleSkillObjective(objectiveId)

    return NextResponse.json(objective)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error toggling skill objective:', error)
    return NextResponse.json(
      { error: 'Failed to toggle skill objective' },
      { status: 500 }
    )
  }
}
