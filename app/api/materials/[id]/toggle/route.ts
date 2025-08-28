import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { materialService } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const materialId = (await params).id
    const material = await materialService.toggleMaterialCompletion(materialId)
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Failed to toggle material completion:', error)
    return NextResponse.json(
      { error: 'Failed to toggle material completion' },
      { status: 500 }
    )
  }
}
