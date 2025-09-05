import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { documentIds } = await request.json()

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: 'Document IDs array is required' }, { status: 400 })
    }

    // Reorder documents in the database
    await documentService.reorderDocuments(userId, documentIds)

    return NextResponse.json({ success: true, message: 'Documents reordered successfully' })

  } catch (error) {
    console.error('Error reordering documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
