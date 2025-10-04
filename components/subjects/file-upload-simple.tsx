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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<SubjectFile[]>([])
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      
      // Check file sizes
      const oversizedFiles = fileArray.filter(file => file.size > 250 * 1024 * 1024) // 250MB limit
      if (oversizedFiles.length > 0) {
        toast({
          title: "Files too large",
          description: `Maximum file size is 250MB. Oversized files: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: "destructive"
        })
        return
      }
      
      setSelectedFiles(fileArray)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setIsUploading(true)

      if (selectedFiles.length === 1) {
        // Single file upload
        const formData = new FormData()
        formData.append('file', selectedFiles[0])
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
        } else {
          throw new Error('Upload failed')
        }
      } else {
        // Multiple file upload
        const formData = new FormData()
        selectedFiles.forEach(file => {
          formData.append('files', file)
        })
        formData.append('subjectId', subjectId)

        const response = await fetch('/api/files/upload-multiple', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.results && data.results.length > 0) {
            const newFiles = data.results.map((result: any) => ({
              ...result.file,
              // Ensure we use originalName for display
              displayName: result.file.originalName || result.file.fileName
            }))
            setFiles(prev => [...newFiles, ...prev])
            
            toast({
              title: "Success",
              description: `Uploaded ${data.uploaded}/${data.total} files successfully`,
            })
          }
          
          if (data.errors && data.errors.length > 0) {
            toast({
              title: "Partial Success",
              description: `Uploaded ${data.uploaded}/${data.total} files. Some files failed: ${data.errors.map((e: any) => e.fileName).join(', ')}`,
              variant: "destructive"
            })
          }
        } else {
          throw new Error('Upload failed')
        }
      }

      setSelectedFiles([])
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
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
          Upload Files
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
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload study materials to this subject (select multiple files to upload at once)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select Files</Label>
              <Input
                id="file"
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav,.ogg,.zip,.rar,.7z,.tar,.gz,.js,.ts,.css,.html,.json,.xml,.csv,.rtf,.odt,.ods,.odp,.svg,.bmp,.tiff,.ico,.avi,.mov,.wmv,.flv,.mkv,.aac,.flac,.m4a"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 20 files, 250MB each. Supported formats: PDF, Documents, Images, Videos, Audio, Slides, Archives, Code files
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1 mr-2">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
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
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
