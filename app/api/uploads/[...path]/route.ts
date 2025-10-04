import { NextRequest } from 'next/server'
import { join } from 'path'
import { stat, readFile } from 'fs/promises'

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params
    const rel = path.join('/')
    // Decode URL-encoded characters
    const decodedRel = decodeURIComponent(rel)
    const abs = join(process.cwd(), 'uploads', decodedRel)
    await stat(abs)
    const buf = await readFile(abs)
    
    // Set appropriate content type based on file extension
    const ext = decodedRel.split('.').pop()?.toLowerCase()
    const contentType = getContentType(ext)
    
    return new Response(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      }
    })
  } catch (error) {
    console.error('File serving error:', error)
    return new Response('Not found', { status: 404 })
  }
}

function getContentType(ext?: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'pdf':
      return 'application/pdf'
    case 'txt':
      return 'text/plain'
    case 'zip':
      return 'application/zip'
    default:
      return 'application/octet-stream'
  }
}


