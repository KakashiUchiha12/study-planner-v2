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
    
    console.log('Serving profile picture:', { userId, filename })

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', userId, 'profile', filename)
    console.log('File path:', filePath)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('File not found at path:', filePath)
      return NextResponse.json(
        { error: 'Profile picture not found' },
        { status: 404 }
      )
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg' // default
    
    switch (ext) {
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

    console.log('Serving file with content type:', contentType)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 year
      },
    })

  } catch (error) {
    console.error('Error serving profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to serve profile picture' },
      { status: 500 }
    )
  }
}
