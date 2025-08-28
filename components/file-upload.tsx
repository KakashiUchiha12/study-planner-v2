"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  X, 
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface FileWithPreview extends File {
  preview?: string
  id: string
  uploadProgress?: number
  uploadStatus?: 'uploading' | 'success' | 'error'
  url?: string
}

interface FileUploadProps {
  onUpload: (files: FileWithPreview[]) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  showPreview?: boolean
  className?: string
}

export function FileUpload({
  onUpload,
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', 'video/*', 'audio/*'],
  showPreview = true,
  className = ""
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    maxSize: maxSize * 1024 * 1024,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>)
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const getFileIcon = (file: File) => {
    if (!file.type) return <FileText className="h-8 w-8 text-gray-500" />
    if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-red-500" />
    if (file.type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-600" />
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="h-8 w-8 text-purple-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const getFileType = (file: File) => {
    if (!file.type) return 'Document'
    if (file.type && file.type.startsWith('image/')) return 'Image'
    if (file.type && file.type.startsWith('video/')) return 'Video'
    if (file.type && file.type.startsWith('audio/')) return 'Audio'
    if (file.type && file.type.includes('pdf')) return 'PDF'
    if (file.type && (file.type.includes('zip') || file.type.includes('rar'))) return 'Archive'
    if (file.type && file.type.startsWith('text/')) return 'Text'
    return 'Document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    
    // Simulate file upload with progress
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
          : f
      ))
      
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, uploadProgress: progress }
            : f
        ))
      }
      
      // Mark as success
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              uploadStatus: 'success', 
              uploadProgress: 100,
              url: `https://example.com/uploads/${file.name}`
            }
          : f
      ))
    }
    
    setUploading(false)
    
    // Call the onUpload callback with uploaded files
    onUpload(files)
  }

  const clearFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
          
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select files
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Max file size: {maxSize}MB</p>
            <p>Max files: {maxFiles}</p>
            <p>Supported: Images, PDFs, Documents, Videos, Audio</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={clearFiles}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <Card key={file.id} className="relative overflow-hidden">
                <CardContent className="p-4">
                  {/* File Preview */}
                  {showPreview && file.preview && file.type && file.type.startsWith('image/') ? (
                    <div className="relative mb-3">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                        onClick={() => window.open(file.preview, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 mb-3 bg-muted rounded-lg">
                      {getFileIcon(file)}
                    </div>
                  )}

                  {/* File Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileType(file)} • {formatFileSize(file.size)}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Upload Progress */}
                    {file.uploadStatus && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize">{file.uploadStatus}</span>
                          {file.uploadProgress !== undefined && (
                            <span>{file.uploadProgress}%</span>
                          )}
                        </div>
                        
                        {file.uploadStatus === 'uploading' && file.uploadProgress !== undefined && (
                          <Progress value={file.uploadProgress} className="h-2" />
                        )}
                        
                        {file.uploadStatus === 'success' && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Uploaded successfully</span>
                          </div>
                        )}
                        
                        {file.uploadStatus === 'error' && (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">Upload failed</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* File Actions */}
                    {file.uploadStatus === 'success' && file.url && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
