import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { materialService } from '@/lib/database'
import { CreateMaterialData } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const subjectId = searchParams.get('subjectId')

    if (!chapterId && !subjectId) {
      return NextResponse.json({ error: 'Either chapterId or subjectId is required' }, { status: 400 })
    }

    let materials
    if (chapterId) {
      materials = await materialService.getMaterialsByChapterId(chapterId)
    } else {
      materials = await materialService.getMaterialsBySubjectId(subjectId!)
    }

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Failed to fetch materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data: CreateMaterialData = await request.json()
    
    // Validate required fields
    if (!data.chapterId || !data.title || !data.type || data.order === undefined) {
      return NextResponse.json(
        { error: 'Chapter ID, title, type, and order are required' },
        { status: 400 }
      )
    }

    const material = await materialService.createMaterial(data)
    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Failed to create material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}
