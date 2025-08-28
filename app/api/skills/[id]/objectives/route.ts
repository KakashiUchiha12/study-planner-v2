import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { skillService } from '@/lib/database'

// POST /api/skills/[id]/objectives - Add a new objective to a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id: skillId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create the objective
    const objective = await skillService.addSkillObjective(skillId, {
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
    const userId = await requireAuth()
    const { id: skillId } = await params

    // Get the skill with objectives
    const skill = await skillService.getSkillById(skillId)
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Check if user owns this skill
    if (skill.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(skill.objectives || [])
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching skill objectives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skill objectives' },
      { status: 500 }
    )
  }
}
