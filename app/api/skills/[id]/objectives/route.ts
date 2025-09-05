import { NextRequest, NextResponse } from 'next/server'
import { skillService } from '@/lib/database'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'

// POST /api/skills/[id]/objectives - Add a new objective to a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create the objective
    const objective = await skillService.addSkillObjective(id, {
      title: body.title,
      description: body.description || undefined,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      completed: body.completed || false
    })

    return NextResponse.json(objective)
  } catch (error) {
    console.error('Error adding skill objective:', error)
    return NextResponse.json(
      { error: 'Failed to add skill objective' },
      { status: 500 }
    )
  }
}

// GET /api/skills/[id]/objectives - Get all objectives for a skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id } = await params

    // Get the skill with objectives
    const skill = await skillService.getSkillById(id)
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Check if user owns this skill
    if (skill.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Return the objectives from the skill
    const skillWithObjectives = skill as any
    return NextResponse.json(skillWithObjectives.objectives || [])
  } catch (error) {
    console.error('Error fetching skill objectives:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
