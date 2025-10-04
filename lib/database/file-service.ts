import { dbService } from './index'
import { SubjectFile } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const unlink = promisify(fs.unlink)

export interface CreateFileData {
  userId: string
  subjectId: string
  fileName: string
  originalName: string
  fileType: string
  mimeType: string
  fileSize: number
  filePath: string
  thumbnailPath?: string
  category: string
  tags?: string[]
  description?: string
  isPublic?: boolean
}

export interface UpdateFileData {
  fileName?: string
  category?: string
  tags?: string[]
  description?: string
  isPublic?: boolean
}

export class FileService {
  private prisma = dbService.getPrisma()

  async createFile(data: CreateFileData): Promise<SubjectFile> {
    try {
      const file = await this.prisma.subjectFile.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags || []),
          category: data.category || 'OTHER'
        }
      })
      return file
    } catch (error) {
      console.error('Error creating file record:', error)
      throw new Error('Failed to create file record')
    }
  }

  async getFilesBySubject(subjectId: string, userId: string): Promise<SubjectFile[]> {
    try {
      const files = await this.prisma.subjectFile.findMany({
        where: {
          subjectId,
          userId
        },
        orderBy: [
          { category: 'asc' },
          { createdAt: 'desc' }
        ]
      })
      return files
    } catch (error) {
      console.error('Error fetching files by subject:', error)
      throw new Error('Failed to fetch files')
    }
  }

  async getFilesByUser(userId: string): Promise<SubjectFile[]> {
    try {
      const files = await this.prisma.subjectFile.findMany({
        where: { userId },
        include: { subject: true },
        orderBy: [
          { createdAt: 'desc' }
        ]
      })
      return files
    } catch (error) {
      console.error('Error fetching files by user:', error)
      throw new Error('Failed to fetch files')
    }
  }

  async getFileById(fileId: string, userId: string): Promise<SubjectFile | null> {
    try {
      const file = await this.prisma.subjectFile.findFirst({
        where: {
          id: fileId,
          userId
        }
      })
      return file
    } catch (error) {
      console.error('Error fetching file by ID:', error)
      throw new Error('Failed to fetch file')
    }
  }

  async updateFile(fileId: string, userId: string, data: UpdateFileData): Promise<SubjectFile> {
    try {
      const file = await this.prisma.subjectFile.update({
        where: {
          id: fileId,
          userId
        },
        data: {
          ...data,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
          updatedAt: new Date()
        }
      })
      return file
    } catch (error) {
      console.error('Error updating file:', error)
      throw new Error('Failed to update file')
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Get file info before deletion
      const file = await this.prisma.subjectFile.findFirst({
        where: {
          id: fileId,
          userId
        }
      })

      if (!file) {
        throw new Error('File not found')
      }

      // Delete from database
      await this.prisma.subjectFile.delete({
        where: {
          id: fileId,
          userId
        }
      })

      // Delete physical file
      try {
        await unlink(file.filePath)
        if (file.thumbnailPath) {
          await unlink(file.thumbnailPath)
        }
      } catch (fileError) {
        console.warn('Could not delete physical file:', fileError)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file')
    }
  }

  async incrementDownloadCount(fileId: string): Promise<void> {
    try {
      await this.prisma.subjectFile.update({
        where: { id: fileId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })
    } catch (error) {
      console.error('Error incrementing download count:', error)
    }
  }

  async getFileStats(userId: string): Promise<{
    totalFiles: number
    totalSize: number
    filesByCategory: Record<string, number>
  }> {
    try {
      const files = await this.prisma.subjectFile.findMany({
        where: { userId },
        select: {
          fileSize: true,
          category: true
        }
      })

      const totalFiles = files.length
      const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0)
      const filesByCategory = files.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return { totalFiles, totalSize, filesByCategory }
    } catch (error) {
      console.error('Error getting file stats:', error)
      throw new Error('Failed to get file stats')
    }
  }

  // File system operations
  async saveFileToDisk(
    fileBuffer: Buffer,
    fileName: string,
    subjectId: string,
    userId: string
  ): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', userId, subjectId)
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, fileBuffer)

      return filePath
    } catch (error) {
      console.error('Error saving file to disk:', error)
      throw new Error('Failed to save file to disk')
    }
  }

  async createThumbnail(
    filePath: string,
    fileName: string,
    subjectId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const ext = path.extname(fileName).toLowerCase()
      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails', userId, subjectId)
      await mkdir(thumbnailsDir, { recursive: true })
      const thumbName = `${path.basename(fileName, ext)}-thumb.webp`
      const thumbFullPath = path.join(thumbnailsDir, thumbName)

      // Lazy import sharp to reduce cold start
      const sharp = (await import('sharp')).default

      // Images: real thumbnail
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext)) {
        await sharp(filePath)
          .resize(480, 480, { fit: 'inside' })
          .webp({ quality: 80 })
          .toFile(thumbFullPath)
        return thumbFullPath
      }

      // PDFs: generate a professional-looking thumbnail with filename
      if (ext === '.pdf') {
        const fileName = path.basename(filePath, ext);
        const displayName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
        
        const svg = Buffer.from(
          `<svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pdfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#B91C1C;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="#F8FAFC"/>
            <rect x="32" y="32" width="416" height="296" rx="16" ry="16" fill="url(#pdfGradient)" stroke="#DC2626" stroke-width="2"/>
            <rect x="48" y="48" width="384" height="264" rx="8" ry="8" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
            
            <!-- PDF Icon -->
            <rect x="200" y="120" width="80" height="100" rx="4" ry="4" fill="#DC2626"/>
            <rect x="210" y="130" width="60" height="80" rx="2" ry="2" fill="#FFFFFF"/>
            <rect x="220" y="140" width="40" height="4" fill="#DC2626"/>
            <rect x="220" y="150" width="30" height="3" fill="#DC2626"/>
            <rect x="220" y="158" width="35" height="3" fill="#DC2626"/>
            <rect x="220" y="166" width="25" height="3" fill="#DC2626"/>
            
            <!-- Filename -->
            <text x="240" y="250" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" font-weight="600" fill="#1F2937">${displayName}</text>
            <text x="240" y="270" dominant-baseline="middle" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#6B7280">PDF Document</text>
          </svg>`
        )
        await sharp(svg).webp({ quality: 85 }).toFile(thumbFullPath)
        return thumbFullPath
      }

      // Videos: attempt first-frame capture with ffmpeg, fallback to placeholder
      if (['.mp4', '.webm', '.mov', '.mkv', '.avi', '.wmv'].includes(ext)) {
        try {
          const ffmpeg = (await import('fluent-ffmpeg')).default
          const ffmpegStatic = (await import('ffmpeg-static')).default as string
          if (ffmpegStatic) {
            ffmpeg.setFfmpegPath(ffmpegStatic)
          }
          const tmpJpg = thumbFullPath.replace(/\.webp$/, '.jpg')
          await new Promise<void>((resolve, reject) => {
            ffmpeg(filePath)
              .on('end', () => resolve())
              .on('error', (err: any) => reject(err))
              .screenshots({
                count: 1,
                timemarks: ['00:00:01.000'],
                filename: path.basename(tmpJpg),
                folder: path.dirname(tmpJpg),
                size: '480x?' ,
              })
          })
          await sharp(tmpJpg).webp({ quality: 80 }).toFile(thumbFullPath)
          return thumbFullPath
        } catch (e) {
          const svg = Buffer.from(
            `<svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#0B1220"/>
              <polygon points="200,150 340,180 200,210" fill="#FFFFFF"/>
            </svg>`
          )
          await sharp(svg).webp({ quality: 80 }).toFile(thumbFullPath)
          return thumbFullPath
        }
      }

      // Other files: generic placeholder
      const svg = Buffer.from(
        `<svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#F9FAFB"/>
          <rect x="24" y="24" width="432" height="312" rx="12" ry="12" fill="#EEF2F7" stroke="#E5E7EB"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" font-family="Arial" fill="#9CA3AF">FILE</text>
        </svg>`
      )
      await sharp(svg).webp({ quality: 80 }).toFile(thumbFullPath)
      return thumbFullPath
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      return null
    }
  }

  getFileCategoryFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('application/pdf')) return 'PDF'
    if (mimeType.startsWith('image/')) return 'IMAGE'
    if (mimeType.startsWith('video/')) return 'VIDEO'
    if (mimeType.startsWith('audio/')) return 'AUDIO'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PRESENTATION'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'SPREADSHEET'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT'
    if (mimeType.includes('text/')) return 'NOTE'
    return 'OTHER'
  }

  getFileIconFromCategory(category: string): string {
    const icons: Record<string, string> = {
      PDF: '📄',
      DOCUMENT: '📝',
      IMAGE: '🖼️',
      VIDEO: '🎥',
      AUDIO: '🎵',
      PRESENTATION: '📊',
      SPREADSHEET: '📈',
      NOTE: '📝',
      ASSIGNMENT: '📋',
      EXAM: '📚',
      SYLLABUS: '📖',
      REFERENCE: '🔍',
      OTHER: '📁'
    }
    return icons[category]
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Save client-generated thumbnail for a file
   */
  async saveThumbnail(fileId: string, thumbnailDataUrl: string): Promise<boolean> {
    try {
      console.log(`[FileService] Saving thumbnail for file ${fileId}`)
      
      // Extract base64 data from data URL
      const base64Data = thumbnailDataUrl.replace(/^data:image\/png;base64,/, '')
      if (!base64Data) {
        console.error('[FileService] Invalid thumbnail data URL format')
        return false
      }
      
      // Convert base64 to buffer
      const thumbnailBuffer = Buffer.from(base64Data, 'base64')
      
      // Generate thumbnail path
      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails')
      const thumbnailPath = path.join(thumbnailsDir, `${fileId}-thumb.png`)
      
      // Ensure thumbnails directory exists
      await mkdir(thumbnailsDir, { recursive: true })
      
      // Save the thumbnail to disk
      await writeFile(thumbnailPath, thumbnailBuffer)
      console.log(`[FileService] Thumbnail saved to disk: ${thumbnailPath}`)
      
      // Update database with new thumbnail path
      await this.prisma.subjectFile.update({
        where: { id: fileId },
        data: { thumbnailPath: thumbnailPath }
      })
      
      console.log(`[FileService] Database updated with thumbnail path: ${thumbnailPath}`)
      
      return true
      
    } catch (error) {
      console.error(`[FileService] Failed to save thumbnail for file ${fileId}:`, error)
      return false
    }
  }
}

export const fileService = new FileService()
