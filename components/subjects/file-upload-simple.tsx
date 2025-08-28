"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, File, Download, Edit, Trash2, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SubjectFile {
  id: string
  fileName: string
  originalName: string
  fileType: string
  mimeType: string
  fileSize: number
  category: string
  tags: string[]
  description?: string
  isPublic: boolean
  downloadCount: number
  createdAt: Date
  updatedAt: Date
}

interface FileUploadProps {
  subjectId: string
}

export function FileUploadSimple({ subjectId }: FileUploadProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<SubjectFile[]>([])
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive"
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('subjectId', subjectId)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const newFile = data.file
        
        setFiles(prev => [newFile, ...prev])
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })

        setSelectedFile(null)
        setIsUploadDialogOpen(false)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (file: SubjectFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
      } else {
        throw new Error('Deletion failed')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast({
        title: "Deletion failed",
        description: "Failed to delete file",
        variant: "destructive"
      })
    }
  }

  const getFileIcon = (category: string) => {
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
    return icons[category] || '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Study Materials</h3>
          <p className="text-sm text-muted-foreground">
            Upload and organize your study files and documents
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-8">
          <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your first study material to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getFileIcon(file.category)}</span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm truncate">
                        {file.originalName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {file.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {file.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {file.description}
                    </p>
                  )}
                  
                  {file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {file.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Downloads: {file.downloadCount}</span>
                    {file.isPublic && (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        Public
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a new study material to this subject
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav,.ogg"
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB. Supported formats: PDF, Documents, Images, Videos, Audio
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Size: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
