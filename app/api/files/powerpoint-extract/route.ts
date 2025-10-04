import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { extractPptxSlides, extractPptxMedia } from 'pptx-content-extractor'
import sharp from 'sharp'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { fileUrl } = await request.json()
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    console.log(`[PowerPoint Extract] Extracting first slide image from: ${fileUrl}`)
    
    try {
      // Construct full URL if it's a relative path
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${fileUrl}`
      
      console.log(`[PowerPoint Extract] Downloading from: ${fullUrl}`)
      
      // Download the PowerPoint file
      const response = await fetch(fullUrl)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Save to temporary file
      const tempPptxPath = join(tmpdir(), `temp-${Date.now()}.pptx`)
      writeFileSync(tempPptxPath, buffer)
      
      try {
        // Extract slides from the PowerPoint file
        const slides = await extractPptxSlides(tempPptxPath)
        
        if (slides.length === 0) {
          throw new Error('No slides found in the presentation')
        }
        
        // Get the first slide
        const firstSlide = slides[0]
        console.log(`[PowerPoint Extract] First slide found with ${firstSlide.mediaNames?.length || 0} media items`)
        
        // Extract media content
        const media = await extractPptxMedia(tempPptxPath)
        
        // Try to find an image from the first slide
        let firstSlideImage = null
        
        if (firstSlide.mediaNames && firstSlide.mediaNames.length > 0) {
          // Find the first image from the first slide
          const firstImageName = firstSlide.mediaNames[0]
          const imageMedia = media.find(m => m.name === firstImageName)
          
          if (imageMedia) {
            // Decode the base64-encoded image content
            const imageBuffer = Buffer.from(imageMedia.content, 'base64')
            
            // Resize to thumbnail size using Sharp
            const resizedBuffer = await sharp(imageBuffer)
              .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
              .png()
              .toBuffer()
            
            // Convert to base64 for frontend
            firstSlideImage = resizedBuffer.toString('base64')
            console.log('[PowerPoint Extract] First slide image extracted successfully')
          }
        }
        
        // If no image found, try to extract text content as fallback
        let slideContent = {
          title: '',
          text: '',
          hasImage: !!firstSlideImage
        }
        
        if (firstSlide.text) {
          slideContent.text = firstSlide.text
        }
        
        if (firstSlide.title) {
          slideContent.title = firstSlide.title
        }
        
        return NextResponse.json({ 
          success: true,
          thumbnailDataUrl: firstSlideImage ? `data:image/png;base64,${firstSlideImage}` : null,
          slideContent,
          message: firstSlideImage ? 'First slide image extracted successfully' : 'No image found in first slide, text content available'
        })
        
      } finally {
        // Clean up temporary file
        try {
          unlinkSync(tempPptxPath)
        } catch (cleanupError) {
          console.warn('Failed to clean up temporary file:', cleanupError)
        }
      }
      
    } catch (parseError) {
      console.error('PowerPoint parsing failed:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse PowerPoint file',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        clientSide: true 
      })
    }
    
  } catch (error) {
    console.error('Failed to extract PowerPoint content:', error)
    return NextResponse.json(
      { error: 'Failed to extract PowerPoint content' },
      { status: 500 }
    )
  }
}
