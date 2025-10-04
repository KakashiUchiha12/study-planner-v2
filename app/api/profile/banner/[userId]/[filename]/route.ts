import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await params

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Construct file path
    const filepath = join(process.cwd(), 'public', 'uploads', userId, 'banner', filename)

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Read and return the file
    const fileBuffer = await readFile(filepath)
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg' // default
    
    switch (extension) {
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('Error serving banner:', error)
    return NextResponse.json(
      { error: 'Failed to serve banner' },
      { status: 500 }
    )
  }
}
