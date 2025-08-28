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
    const { skillIds } = await request.json()
    
    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json({ error: 'Invalid skill IDs provided' }, { status: 400 })
    }

    // Update the order of skills in the database
    const updates = skillIds.map((skillId: string, index: number) => 
      dbService.getPrisma().skill.update({
        where: { id: skillId, userId: userId },
        data: { order: index }
      })
    )

    await dbService.getPrisma().$transaction(updates)

    // Fetch updated skills to return
    const updatedSkills = await dbService.getPrisma().skill.findMany({
      where: { userId: userId },
      orderBy: { order: 'asc' },
      include: {
        objectives: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedSkills)
  } catch (error) {
    console.error('Error reordering skills:', error)
    return NextResponse.json(
      { error: 'Failed to reorder skills' },
      { status: 500 }
    )
  }
}
