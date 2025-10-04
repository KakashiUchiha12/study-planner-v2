import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { documentService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    const document = await documentService.getDocumentById(id)
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    // Get document to verify ownership
    const document = await documentService.getDocumentById(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const updatedDocument = await documentService.updateDocument(id, body)
    return NextResponse.json(updatedDocument)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    const { id } = await params
    
    // Get document to verify ownership
    const document = await documentService.getDocumentById(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    await documentService.deleteDocument(id)
    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
