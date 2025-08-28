import { NextRequest, NextResponse } from 'next/server'
import { skillService } from '@/lib/database'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const skills = await skillService.getUserSkills(userId)
    return NextResponse.json(skills)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    const skill = await skillService.createSkill(userId, body)
    return NextResponse.json(skill)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error creating skill:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      )
    }

    const skill = await skillService.updateSkill(body.id, body)
    return NextResponse.json(skill)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error updating skill:', error)
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('id')

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      )
    }

    await skillService.deleteSkill(skillId)
    return NextResponse.json({ message: 'Skill deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error deleting skill:', error)
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
