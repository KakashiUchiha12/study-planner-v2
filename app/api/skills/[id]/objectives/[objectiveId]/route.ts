import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { skillService } from '@/lib/database'

// GET /api/skills/[id]/objectives/[objectiveId] - Get an objective
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id, objectiveId } = await params

    // Get the skill with objectives to find the specific objective
    const skill = await skillService.getSkillById(id)
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Check if user owns this skill
    if (skill.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find the specific objective
    const skillWithObjectives = skill as any
    const objective = skillWithObjectives.objectives?.find((obj: any) => obj.id === objectiveId)
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    return NextResponse.json(objective)
  } catch (error) {
    console.error('Error fetching skill objective:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { objectiveId } = await params
    const body = await request.json()

    // Update the objective
    const updatedObjective = await skillService.updateSkillObjective(objectiveId, {
      title: body.title,
      description: body.description || undefined,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      completed: body.completed
    })

    return NextResponse.json(updatedObjective)
  } catch (error) {
    console.error('Error updating skill objective:', error)
    return NextResponse.json({ error: 'Failed to update skill objective' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { objectiveId } = await params

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
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { objectiveId } = await params

    // Toggle the objective completion
    const objective = await skillService.toggleSkillObjective(objectiveId)

    return NextResponse.json(objective)
  } catch (error) {
    console.error('Error toggling skill objective:', error)
    return NextResponse.json(
      { error: 'Failed to toggle skill objective' },
      { status: 500 }
    )
  }
}
