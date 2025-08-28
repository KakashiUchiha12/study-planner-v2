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
      // For now, return null - thumbnail generation can be implemented later
      // This could use libraries like sharp for images, pdf-poppler for PDFs, etc.
      // TODO: Implement actual thumbnail generation
      return null
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
}

export const fileService = new FileService()
