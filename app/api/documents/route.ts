import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/database'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const documents = await documentService.getUserDocuments(userId)
    return NextResponse.json(documents)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as any

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Convert the file to a format that can be processed by the document service
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size

    const document = await documentService.uploadDocument(userId, {
      name: fileName,
      type: fileType,
      size: fileSize,
      buffer: fileBuffer
    })
    
    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
