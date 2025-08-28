import { PrismaClient } from '@prisma/client'
import { Document } from './index'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

const prisma = new PrismaClient()

export interface CreateDocumentData {
  name: string
  originalName: string
  type: string
  mimeType: string
  size: number
  filePath: string
  thumbnailPath?: string
  tags?: string[]
  isPinned?: boolean
}

export interface UpdateDocumentData {
  name?: string
  tags?: string[]
  isPinned?: boolean
  order?: number
}

export interface UploadFileData {
  name: string
  type: string
  size: number
  buffer: Buffer
}

export class DocumentService {
  private uploadsDir = join(process.cwd(), 'uploads')
  private userUploadsDir = (userId: string) => join(this.uploadsDir, 'users', userId, 'documents')
  private thumbnailsDir = join(process.cwd(), 'uploads', 'thumbnails')

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<any[]> {
    try {
      return await (prisma as any).document.findMany({
        where: { userId },
        orderBy: [
          { isPinned: 'desc' },
          { order: 'asc' },
          { uploadedAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error fetching user documents:', error)
      throw new Error('Failed to fetch user documents')
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<any | null> {
    try {
      return await (prisma as any).document.findUnique({
        where: { id: documentId }
      })
    } catch (error) {
      console.error('Error fetching document:', error)
      throw new Error('Failed to fetch document')
    }
  }

  /**
   * Upload a new document
   */
  async uploadDocument(userId: string, file: UploadFileData): Promise<Document> {
    try {
      // Ensure upload directory exists
      const userDir = this.userUploadsDir(userId)
      await this.ensureDirectoryExists(userDir)
      await this.ensureDirectoryExists(this.thumbnailsDir)

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      const filePath = join(userDir, uniqueFilename)

      // Save file to disk
      await writeFile(filePath, file.buffer)

      // Get the next order number
      const lastDocument = await (prisma as any).document.findFirst({
        where: { userId },
        orderBy: { order: 'desc' }
      })
      const nextOrder = (lastDocument?.order ?? -1) + 1

      // Create document record
      const document = await (prisma as any).document.create({
        data: {
          userId,
          name: file.name,
          originalName: file.name,
          type: this.getFileType(file.name, file.type),
          mimeType: file.type,
          size: file.size,
          filePath: filePath.replace(process.cwd(), '').replace(/\\/g, '/'), // Store relative path
          tags: JSON.stringify([]),
          isPinned: false,
          order: nextOrder
        }
      })

      // Generate thumbnail synchronously to ensure it's available
      try {
        await this.generateThumbnail(document.id, filePath, file.type)
      } catch (error) {
        console.error('Thumbnail generation failed for', file.name, ':', error)
        // Continue even if thumbnail fails
      }

      return document
    } catch (error) {
      console.error('Error uploading document:', error)
      throw new Error('Failed to upload document')
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, data: UpdateDocumentData): Promise<Document> {
    try {
      const updateData: any = { ...data }
      if (data.tags) {
        updateData.tags = JSON.stringify(data.tags)
      }

      return await (prisma as any).document.update({
        where: { id: documentId },
        data: updateData
      })
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const document = await (prisma as any).document.findUnique({
        where: { id: documentId }
      })

      if (!document) {
        throw new Error('Document not found')
      }

      // Delete file from disk
      const fullPath = join(process.cwd(), document.filePath)
      if (existsSync(fullPath)) {
        await unlink(fullPath)
      }

      // Delete thumbnail if exists
      if (document.thumbnailPath) {
        const thumbnailFullPath = join(process.cwd(), document.thumbnailPath)
        if (existsSync(thumbnailFullPath)) {
          await unlink(thumbnailFullPath)
        }
      }

      // Delete database record
      await (prisma as any).document.delete({
        where: { id: documentId }
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  /**
   * Reorder documents
   */
  async reorderDocuments(userId: string, documentIds: string[]): Promise<void> {
    try {
      const updates = documentIds.map((documentId, index) => 
        (prisma as any).document.update({
          where: { id: documentId },
          data: { order: index }
        })
      )
      
      await (prisma as any).$transaction(updates)
    } catch (error) {
      console.error('Error reordering documents:', error)
      throw new Error('Failed to reorder documents')
    }
  }

  /**
   * Toggle document pin status
   */
  async toggleDocumentPin(documentId: string): Promise<Document> {
    try {
      const document = await (prisma as any).document.findUnique({
        where: { id: documentId }
      })

      if (!document) {
        throw new Error('Document not found')
      }

      return await (prisma as any).document.update({
        where: { id: documentId },
        data: { isPinned: !document.isPinned }
      })
    } catch (error) {
      console.error('Error toggling document pin:', error)
      throw new Error('Failed to toggle document pin')
    }
  }

  /**
   * Generate thumbnail for document
   */
  async generateThumbnail(documentId: string, filePath: string, mimeType: string): Promise<string | null> {
    try {
      console.log(`Generating thumbnail for document ${documentId}, type: ${mimeType}`)
      let thumbnailPath: string | null = null

      if (mimeType.startsWith('image/')) {
        // For images, create a resized thumbnail
        console.log('Generating image thumbnail...')
        thumbnailPath = await this.generateImageThumbnail(filePath, documentId)
      } else if (mimeType === 'application/pdf') {
        // For PDFs, generate first page thumbnail
        console.log('Generating PDF thumbnail...')
        thumbnailPath = await this.generatePDFThumbnail(filePath, documentId)
      } else if (mimeType.startsWith('video/')) {
        // For videos, generate first frame thumbnail
        console.log('Generating video thumbnail...')
        thumbnailPath = await this.generateVideoThumbnail(filePath, documentId)
      } else {
        // For other documents, create a document icon
        console.log('Generating document icon...')
        thumbnailPath = await this.generateDocumentIcon(documentId, mimeType)
      }

      if (thumbnailPath) {
        console.log(`Thumbnail generated successfully: ${thumbnailPath}`)
        // Update the document with thumbnail path
        await (prisma as any).document.update({
          where: { id: documentId },
          data: { thumbnailPath: thumbnailPath.replace(process.cwd(), '').replace(/\\/g, '/') }
        })
        console.log('Document updated with thumbnail path')
        return thumbnailPath
      }

      return null
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return null
    }
  }

  /**
   * Generate image thumbnail
   */
  private async generateImageThumbnail(filePath: string, documentId: string): Promise<string> {
    const thumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb.png`)
    
    try {
      // Use Sharp for high-quality image thumbnails
      await sharp(filePath)
        .resize(200, 150, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 248, g: 250, b: 252, alpha: 1 } // Light gray background
        })
        .png({ quality: 90 })
        .toFile(thumbnailPath)
      
      return thumbnailPath
    } catch (error) {
      console.error('Sharp thumbnail generation failed, trying canvas fallback:', error)
      
      // Fallback to canvas if Sharp fails
      try {
        const canvas = await import('canvas')
        const canvasInstance = canvas.createCanvas(200, 150)
        const context = canvasInstance.getContext('2d')
        
        // Set background
        context.fillStyle = '#f8fafc'
        context.fillRect(0, 0, 200, 150)
        
        // Add image icon
        context.fillStyle = '#10b981'
        context.fillRect(60, 30, 80, 90)
        
        // Add text
        context.fillStyle = 'white'
        context.font = 'bold 16px Arial'
        context.textAlign = 'center'
        context.fillText('IMG', 100, 75)
        
        // Save as PNG
        const buffer = canvasInstance.toBuffer('image/png')
        const fs = await import('fs')
        await fs.promises.writeFile(thumbnailPath, buffer)
        
        return thumbnailPath
      } catch (canvasError) {
        console.error('Canvas fallback also failed:', canvasError)
        throw error // Re-throw original error
      }
    }
  }

  /**
   * Generate PDF thumbnail (first page)
   */
  private async generatePDFThumbnail(filePath: string, documentId: string): Promise<string> {
    const thumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb.png`)
    
    try {
      console.log(`[PDF] Generating thumbnail for ${documentId}`)
      console.log(`[PDF] File path: ${filePath}`)
      
      // Check if file exists
      const fs = await import('fs')
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`)
      }
      
      // Since server-side PDF processing is unreliable, we'll create a placeholder
      // The actual PDF thumbnail will be generated client-side when the document is viewed
      console.log(`[PDF] Creating server-side placeholder, client will generate real thumbnail`)
      
      // Create a placeholder that indicates this is a PDF
      await this.createPDFPlaceholder(documentId, thumbnailPath)
      
      return thumbnailPath
      
    } catch (error) {
      console.error(`[PDF] Thumbnail generation failed for ${documentId}:`, error)
      
      // Create a basic PDF icon as fallback
      await this.createPDFPlaceholder(documentId, thumbnailPath)
      return thumbnailPath
    }
  }

  /**
   * Create PDF placeholder (client will generate real thumbnail)
   */
  private async createPDFPlaceholder(documentId: string, thumbnailPath: string): Promise<void> {
    try {
      const canvas = await import('canvas')
      const canvasInstance = canvas.createCanvas(200, 150)
      const context = canvasInstance.getContext('2d')
      
      // Create a realistic document background
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, 200, 150)
      
      // Add border
      context.strokeStyle = '#e5e7eb'
      context.lineWidth = 1
      context.strokeRect(0, 0, 200, 150)
      
      // Add PDF icon (red rectangle)
      context.fillStyle = '#ef4444'
      context.fillRect(60, 30, 80, 90)
      
      // Add PDF text
      context.fillStyle = 'white'
      context.font = 'bold 16px Arial'
      context.textAlign = 'center'
      context.fillText('PDF', 100, 75)
      
      // Add document lines to simulate content
      context.fillStyle = 'white'
      context.fillRect(75, 65, 50, 2)
      context.fillRect(75, 70, 40, 2)
      context.fillRect(75, 75, 45, 2)
      context.fillRect(75, 80, 35, 2)
      
      // Add file info
      context.fillStyle = '#6b7280'
      context.font = '10px Arial'
      context.textAlign = 'center'
      context.fillText('Document', 100, 115)
      
             // Save as PNG
       const buffer = canvasInstance.toBuffer('image/png')
       const fsModule = await import('fs')
       await fsModule.promises.writeFile(thumbnailPath, buffer)
       
       console.log(`[PDF] Placeholder created: ${thumbnailPath}`)
      
    } catch (error) {
      console.error(`[PDF] Placeholder creation failed:`, error)
      throw error
    }
  }

  /**
   * Generate video thumbnail (first frame)
   */
  private async generateVideoThumbnail(filePath: string, documentId: string): Promise<string> {
    const thumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb.png`)
    
    try {
      console.log(`[VIDEO] Generating thumbnail for ${documentId}`)
      console.log(`[VIDEO] File path: ${filePath}`)
      
      // Check if file exists
      const fs = await import('fs')
      if (!fs.existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`)
      }
      
      // For now, create a video icon since video frame extraction requires additional libraries
      // In a production environment, you might want to use ffmpeg or similar
      console.log(`[VIDEO] Creating video icon thumbnail...`)
      await this.createVideoIcon(documentId, thumbnailPath)
      
      return thumbnailPath
      
    } catch (error) {
      console.error(`[VIDEO] Thumbnail generation failed for ${documentId}:`, error)
      
      // Create a fallback video icon
      await this.createVideoIcon(documentId, thumbnailPath)
      return thumbnailPath
    }
  }

  /**
   * Create video icon thumbnail
   */
  private async createVideoIcon(documentId: string, thumbnailPath: string): Promise<void> {
    try {
      const canvas = await import('canvas')
      const canvasInstance = canvas.createCanvas(200, 150)
      const context = canvasInstance.getContext('2d')
      
      // Set background
      context.fillStyle = '#000000'
      context.fillRect(0, 0, 200, 150)
      
      // Add border
      context.strokeStyle = '#e5e7eb'
      context.lineWidth = 1
      context.strokeRect(0, 0, 200, 150)
      
      // Add video icon (play button)
      context.fillStyle = '#ffffff'
      context.beginPath()
      context.moveTo(80, 50)
      context.lineTo(80, 100)
      context.lineTo(130, 75)
      context.closePath()
      context.fill()
      
      // Add video text
      context.fillStyle = '#ffffff'
      context.font = 'bold 16px Arial'
      context.textAlign = 'center'
      context.fillText('VIDEO', 100, 120)
      
      // Add file type info
      context.fillStyle = '#9ca3af'
      context.font = '12px Arial'
      context.fillText('Media File', 100, 140)
      
      // Save as PNG
      const buffer = canvasInstance.toBuffer('image/png')
      const fs = await import('fs')
      await fs.promises.writeFile(thumbnailPath, buffer)
      
    } catch (error) {
      console.error('Video icon creation failed:', error)
      // Fallback to basic icon
      await this.createBasicDocumentIcon(documentId, thumbnailPath)
    }
  }

  /**
   * Generate document icon
   */
  private async generateDocumentIcon(documentId: string, mimeType: string): Promise<string> {
    const thumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb.png`)
    
    try {
      // For text documents, try to create a preview with content
      if (mimeType.includes('text') || mimeType.includes('document')) {
        await this.createDocumentPreview(documentId, thumbnailPath, mimeType)
      } else {
        // For other types, create a styled document icon
        await this.createStyledDocumentIcon(documentId, thumbnailPath, mimeType)
      }
      
      return thumbnailPath
    } catch (error) {
      console.error('Document icon generation failed:', error)
      // Fallback to basic icon
      await this.createBasicDocumentIcon(documentId, thumbnailPath)
      return thumbnailPath
    }
  }

  /**
   * Create document preview with content
   */
     private async createDocumentPreview(documentId: string, thumbnailPath: string, mimeType: string): Promise<void> {
     try {
       const canvas = await import('canvas')
       const fs = await import('fs')
       const canvasInstance = canvas.createCanvas(200, 150)
       const context = canvasInstance.getContext('2d')
       
       // Set background
       context.fillStyle = '#ffffff'
       context.fillRect(0, 0, 200, 150)
       
       // Add border
       context.strokeStyle = '#e5e7eb'
       context.lineWidth = 1
       context.strokeRect(0, 0, 200, 150)
       
       // Try to read file content for text files
       if (mimeType.startsWith('text/') || mimeType.includes('document')) {
         try {
           // Find the document file path
           const document = await (prisma as any).document.findUnique({
             where: { id: documentId }
           })
           
           if (document && document.filePath) {
             const fullPath = join(process.cwd(), document.filePath)
             if (fs.existsSync(fullPath)) {
               const content = fs.readFileSync(fullPath, 'utf8')
               const lines = content.split('\n').slice(0, 8) // First 8 lines
              
              // Add document icon
              context.fillStyle = '#2563eb'
              context.fillRect(20, 20, 30, 40)
              
              // Add content preview
              context.fillStyle = '#374151'
              context.font = '8px monospace'
              context.textAlign = 'left'
              
              let y = 80
              for (let i = 0; i < lines.length && y < 130; i++) {
                const line = lines[i].trim()
                if (line.length > 0) {
                  // Truncate long lines
                  const displayLine = line.length > 25 ? line.substring(0, 22) + '...' : line
                  context.fillText(displayLine, 60, y)
                  y += 12
                }
              }
              
              // Add file type indicator
              context.fillStyle = '#6b7280'
              context.font = '10px Arial'
              context.textAlign = 'center'
              context.fillText('Text Document', 100, 140)
              
              // Save as PNG
              const buffer = canvasInstance.toBuffer('image/png')
              const fs = await import('fs')
        await fs.promises.writeFile(thumbnailPath, buffer)
              return
            }
          }
        } catch (contentError) {
          console.log('Could not read file content for preview:', contentError)
        }
      }
      
      // Fallback to generic document icon
      context.fillStyle = '#2563eb'
      context.fillRect(60, 30, 80, 90)
      
      // Add text
      context.fillStyle = 'white'
      context.font = 'bold 16px Arial'
      context.textAlign = 'center'
      context.fillText('DOC', 100, 75)
      
      // Add file type info
      context.fillStyle = '#374151'
      context.font = '12px Arial'
      context.fillText('Document', 100, 110)
      
             // Save as PNG
       const buffer = canvasInstance.toBuffer('image/png')
       const fsModule2 = await import('fs')
       await fsModule2.promises.writeFile(thumbnailPath, buffer)
     } catch (error) {
       console.error('Document preview creation failed:', error)
      // Fallback to basic icon
      await this.createBasicDocumentIcon(documentId, thumbnailPath)
    }
  }

     /**
    * Create styled document icon
    */
      private async createStyledDocumentIcon(documentId: string, thumbnailPath: string, mimeType: string): Promise<void> {
      const canvas = await import('canvas')
      const fsModule3 = await import('fs')
      const canvasInstance = canvas.createCanvas(200, 150)
      const context = canvasInstance.getContext('2d')
     
     // Set background
     context.fillStyle = '#f0f9ff'
     context.fillRect(0, 0, 200, 150)
     
     // Add document icon
     context.fillStyle = '#2563eb'
     context.fillRect(60, 30, 80, 90)
     
     // Add text
     context.fillStyle = 'white'
     context.font = 'bold 16px Arial'
     context.textAlign = 'center'
     context.fillText('DOC', 100, 75)
     
     // Add file type info
     context.fillStyle = '#374151'
     context.font = '12px Arial'
     context.fillText('Document', 100, 110)
     
     // Save as PNG
     const buffer = canvasInstance.toBuffer('image/png')
     await fsModule3.promises.writeFile(thumbnailPath, buffer)
   }

     /**
    * Create basic document icon as fallback
    */
      private async createBasicDocumentIcon(documentId: string, thumbnailPath: string): Promise<void> {
      const canvas = await import('canvas')
      const fsModule4 = await import('fs')
      const canvasInstance = canvas.createCanvas(200, 150)
      const context = canvasInstance.getContext('2d')
     
     // Set background
     context.fillStyle = '#f0f9ff'
     context.fillRect(0, 0, 200, 150)
     
     // Add document icon
     context.fillStyle = '#2563eb'
     context.fillRect(60, 30, 80, 90)
     
     // Add text
     context.fillStyle = 'white'
     context.font = 'bold 16px Arial'
     context.textAlign = 'center'
     context.fillText('DOC', 100, 75)
     
     // Save as PNG
     const buffer = canvasInstance.toBuffer('image/png')
     await fsModule4.promises.writeFile(thumbnailPath, buffer)
   }

  /**
   * Save client-generated high-quality thumbnail
   */
  async saveClientGeneratedThumbnail(documentId: string, thumbnailDataUrl: string): Promise<boolean> {
    try {
      console.log(`[PDF] Saving client-generated high-quality thumbnail for ${documentId}`)
      
      // Extract base64 data from data URL
      const base64Data = thumbnailDataUrl.replace(/^data:image\/png;base64,/, '')
      if (!base64Data) {
        console.error('[PDF] Invalid thumbnail data URL format')
        return false
      }
      
      // Convert base64 to buffer
      const thumbnailBuffer = Buffer.from(base64Data, 'base64')
      
      // Generate thumbnail path
      const thumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb-hq.png`)
      
      // Ensure thumbnails directory exists
      await this.ensureDirectoryExists(this.thumbnailsDir)
      
      // Save the high-quality thumbnail to disk
      await writeFile(thumbnailPath, thumbnailBuffer)
      console.log(`[PDF] High-quality thumbnail saved to disk: ${thumbnailPath}`)
      
      // Update database with new thumbnail path
      const relativePath = thumbnailPath.replace(process.cwd(), '').replace(/\\/g, '/')
      await (prisma as any).document.update({
        where: { id: documentId },
        data: { thumbnailPath: relativePath }
      })
      
      console.log(`[PDF] Database updated with new thumbnail path: ${relativePath}`)
      
      // Clean up old low-quality thumbnail if it exists
      const oldThumbnailPath = join(this.thumbnailsDir, `${documentId}-thumb.png`)
      if (existsSync(oldThumbnailPath) && oldThumbnailPath !== thumbnailPath) {
        try {
          await unlink(oldThumbnailPath)
          console.log(`[PDF] Old low-quality thumbnail cleaned up: ${oldThumbnailPath}`)
        } catch (cleanupError) {
          console.warn(`[PDF] Failed to clean up old thumbnail:`, cleanupError)
        }
      }
      
      return true
      
    } catch (error) {
      console.error(`[PDF] Failed to save client-generated thumbnail for ${documentId}:`, error)
      return false
    }
  }

  /**
   * Get document file path for download/viewing
   */
  async getDocumentFilePath(documentId: string): Promise<string | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      })

      if (!document) {
        return null
      }

      return join(process.cwd(), document.filePath)
    } catch (error) {
      console.error('Error getting document file path:', error)
      return null
    }
  }

  /**
   * Get document thumbnail path
   */
  async getDocumentThumbnailPath(documentId: string): Promise<string | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      })

      if (!document || !document.thumbnailPath) {
        return null
      }

      return join(process.cwd(), document.thumbnailPath)
    } catch (error) {
      console.error('Error getting document thumbnail path:', error)
      return null
    }
  }

  /**
   * Search documents by name or tags
   */
  async searchDocuments(userId: string, query: string): Promise<Document[]> {
    try {
      return await prisma.document.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { isPinned: 'desc' },
          { order: 'asc' },
          { uploadedAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error('Failed to search documents')
    }
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(userId: string, type: string): Promise<Document[]> {
    try {
      return await prisma.document.findMany({
        where: { userId, type },
        orderBy: [
          { isPinned: 'desc' },
          { order: 'asc' },
          { uploadedAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error fetching documents by type:', error)
      throw new Error('Failed to fetch documents by type')
    }
  }

  /**
   * Get pinned documents
   */
  async getPinnedDocuments(userId: string): Promise<Document[]> {
    try {
      return await prisma.document.findMany({
        where: { userId, isPinned: true },
        orderBy: { order: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching pinned documents:', error)
      throw new Error('Failed to fetch pinned documents')
    }
  }

  /**
   * Helper method to ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true })
      }
    } catch (error) {
      console.error('Error creating directory:', error)
      throw new Error('Failed to create upload directory')
    }
  }

  /**
   * Helper method to determine file type
   */
  private getFileType(fileName: string, mimeType: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (mimeType.startsWith('image/')) return 'image'
    if (extension === 'pdf') return 'pdf'
    if (extension === 'doc') return 'doc'
    if (extension === 'docx') return 'docx'
    if (extension === 'txt') return 'txt'
    
    return 'other'
  }
}

export const documentService = new DocumentService()
