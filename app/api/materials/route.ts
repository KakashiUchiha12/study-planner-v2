import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { materialService } from '@/lib/database'
import { CreateMaterialData } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('[API Materials] GET request received')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      console.log('[API Materials] Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
      console.log('[API Materials] Subject ID missing')
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    console.log('[API Materials] Getting materials for subject:', subjectId)
    const materials = await materialService.getMaterialsBySubjectId(subjectId)
    console.log('[API Materials] Found materials:', materials.length)
    
    return NextResponse.json(materials)
  } catch (error) {
    console.error('[API Materials] Failed to fetch materials:', error)
    console.error('[API Materials] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Materials] POST request received')
    
    const session = await getServerSession(authOptions)
    console.log('[API Materials] Session:', !!session, 'User ID:', (session?.user as any)?.id)
    
    if (!session?.user || !(session.user as any).id) {
      console.log('[API Materials] Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data: CreateMaterialData = await request.json()
    console.log('[API Materials] Request data:', data)
    
    // Validate required fields
    if (!data.subjectId || !data.title || !data.type || data.order === undefined) {
      console.log('[API Materials] Validation failed:', {
        subjectId: !!data.subjectId,
        title: !!data.title,
        type: !!data.type,
        order: data.order
      })
      return NextResponse.json(
        { error: 'Subject ID, title, type, and order are required' },
        { status: 400 }
      )
    }

    console.log('[API Materials] Creating material via service...')
    const material = await materialService.createMaterial(data)
    console.log('[API Materials] Material created successfully:', material.id)
    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('[API Materials] Failed to create material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('[API Materials] PATCH request received for reordering')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      console.log('[API Materials] Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    console.log('[API Materials] Reorder data:', data)
    
    // Validate required fields
    if (!data.subjectId || !data.materialOrders || !Array.isArray(data.materialOrders)) {
      console.log('[API Materials] Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Subject ID and material orders array are required' },
        { status: 400 }
      )
    }

    console.log('[API Materials] Calling materialService.reorderMaterials...')
    await materialService.reorderMaterials(data.subjectId, data.materialOrders)
    console.log('[API Materials] Materials reordered successfully')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Materials] Failed to reorder materials:', error)
    console.error('[API Materials] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to reorder materials' },
      { status: 500 }
    )
  }
}