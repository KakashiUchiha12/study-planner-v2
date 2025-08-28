"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  X, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Tag,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { FileCategory } from '@prisma/client'

interface SubjectFile {
  id: string
  fileName: string
  originalName: string
  fileType: string
  mimeType: string
  fileSize: number
  category: FileCategory
  tags: string[]
  description?: string
  isPublic: boolean
  downloadCount: number
  createdAt: Date
  updatedAt: Date
}

interface FileUploadProps {
  subjectId: string
  onFileUploaded?: (file: SubjectFile) => void
  onFileDeleted?: (fileId: string) => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUpload({ subjectId, onFileUploaded, onFileDeleted }: FileUploadProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SubjectFile | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<SubjectFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const { toast } = useToast()

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: 'OTHER' as FileCategory,
    tags: [] as string[],
    description: '',
    isPublic: false
  })

  // Form state for edit
  const [editForm, setEditForm] = useState({
    fileName: '',
    category: 'OTHER' as FileCategory,
    tags: [] as string[],
    description: '',
    isPublic: false
  })

  // Load files on component mount
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/files?subjectId=${subjectId}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error('Error loading files:', error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [subjectId, toast])

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive"
        })
        return
      }
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('subjectId', subjectId)
      formData.append('category', uploadForm.category)
      formData.append('tags', JSON.stringify(uploadForm.tags))
      formData.append('description', uploadForm.description)
      formData.append('isPublic', uploadForm.isPublic.toString())

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        const newFile = data.file
        
        setFiles(prev => [newFile, ...prev])
        onFileUploaded?.(newFile)
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })

        // Reset form and close dialog
        setUploadForm({
          file: null,
          category: 'OTHER',
          tags: [],
          description: '',
          isPublic: false
        })
        setIsUploadDialogOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle file edit
  const handleEdit = async () => {
    if (!selectedFile) return

    try {
      const response = await fetch(`/api/files/${selectedFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        const updatedFile = data.file
        
        setFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f))
        
        toast({
          title: "Success",
          description: "File updated successfully",
        })

        setIsEditDialogOpen(false)
        setSelectedFile(null)
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Update failed",
        description: "Failed to update file",
        variant: "destructive"
      })
    }
  }

  // Handle file deletion
  const handleDelete = async () => {
    if (!selectedFile) return

    try {
      const response = await fetch(`/api/files/${selectedFile.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== selectedFile.id))
        onFileDeleted?.(selectedFile.id)
        
        toast({
          title: "Success",
          description: "File deleted successfully",
        })

        setIsDeleteDialogOpen(false)
        setSelectedFile(null)
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

  // Handle file download
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

  // Filter files based on search and category
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Get file icon based on category
  const getFileIcon = (category: FileCategory) => {
    const icons: Record<FileCategory, string> = {
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Study Materials</h3>
          <p className="text-sm text-muted-foreground">
            Upload and organize your study files, notes, and documents
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="DOCUMENT">Document</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="PRESENTATION">Presentation</SelectItem>
            <SelectItem value="SPREADSHEET">Spreadsheet</SelectItem>
            <SelectItem value="NOTE">Note</SelectItem>
            <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
            <SelectItem value="EXAM">Exam</SelectItem>
            <SelectItem value="SYLLABUS">Syllabus</SelectItem>
            <SelectItem value="REFERENCE">Reference</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No files found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your first study material to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
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
                      onClick={() => {
                        setSelectedFile(file)
                        setEditForm({
                          fileName: file.originalName,
                          category: file.category,
                          tags: file.tags,
                          description: file.description || '',
                          isPublic: file.isPublic
                        })
                        setIsEditDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(file)
                        setIsDeleteDialogOpen(true)
                      }}
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
                      {formatDate(file.createdAt)}
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
                      {file.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{file.tags.length - 3}
                        </Badge>
                      )}
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
            {/* File Input */}
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

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value as FileCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="AUDIO">Audio</SelectItem>
                  <SelectItem value="PRESENTATION">Presentation</SelectItem>
                  <SelectItem value="SPREADSHEET">Spreadsheet</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="SYLLABUS">Syllabus</SelectItem>
                  <SelectItem value="REFERENCE">Reference</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., chapter 1, important, exam prep"
                value={uploadForm.tags.join(', ')}
                onChange={(e) => setUploadForm(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the file content..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={uploadForm.isPublic}
                onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isPublic">Make this file public</Label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
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
              disabled={!uploadForm.file || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
            <DialogDescription>
              Update file information and metadata
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="editFileName">File Name</Label>
              <Input
                id="editFileName"
                value={editForm.fileName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fileName: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value as FileCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="AUDIO">Audio</SelectItem>
                  <SelectItem value="PRESENTATION">Presentation</SelectItem>
                  <SelectItem value="SPREADSHEET">Spreadsheet</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="SYLLABUS">Syllabus</SelectItem>
                  <SelectItem value="REFERENCE">Reference</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="editTags">Tags (comma-separated)</Label>
              <Input
                id="editTags"
                placeholder="e.g., chapter 1, important, exam prep"
                value={editForm.tags.join(', ')}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Brief description of the file content..."
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsPublic"
                checked={editForm.isPublic}
                onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="editIsPublic">Make this file public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Update File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFile?.originalName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
