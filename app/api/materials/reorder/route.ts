import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { materialService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { chapterId, materialOrders } = await request.json()
    
    if (!chapterId || !materialOrders || !Array.isArray(materialOrders)) {
      return NextResponse.json(
        { error: 'Chapter ID and material orders are required' },
        { status: 400 }
      )
    }

    console.log(`[API Materials Reorder] Reordering materials in chapter ${chapterId}:`, materialOrders)
    
    // Validate that all materials belong to the same chapter
    const materialIds = materialOrders.map(mo => mo.id)
    console.log(`[API Materials Reorder] Material IDs:`, materialIds)
    
    await materialService.reorderMaterials(chapterId, materialOrders)
    
    return NextResponse.json({ 
      success: true,
      message: 'Materials reordered successfully'
    })
    
  } catch (error) {
    console.error('Failed to reorder materials:', error)
    return NextResponse.json(
      { error: 'Failed to reorder materials' },
      { status: 500 }
    )
  }
}
