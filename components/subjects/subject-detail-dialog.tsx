"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BookOpen,
  Calendar,
  Target,
  Upload,
  Plus,
  Edit2,
  Download,
  Eye,
  Trash2,
  FileText,
  ImageIcon,
  File,
  GripVertical,
  Search,
  BookMarked,
} from "lucide-react"
import { FileUploadSimple } from '@/components/subjects/file-upload-simple'
import { useChapters } from '@/hooks/useChapters'
import { useMaterials } from '@/hooks/useMaterials'
import { PDFThumbnail } from '@/components/pdf-thumbnail'
import { Chapter, Material } from '@/lib/database'

interface Subject {
  id: string
  name: string
  description: string
  materials: Material[]
  color: string
  progress: number
  totalChapters: number
  completedChapters: number
  createdAt: string
  chapters?: Chapter[] // Added chapters property
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  note?: string
  uploadedAt: string
}

interface MaterialLink {
  id: string
  url: string
  description: string
  createdAt: string
}

interface SubjectDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
}

export function SubjectDetailDialog({ 
  open, 
  onOpenChange, 
  subject 
}: SubjectDetailDialogProps) {
  // Utility function to safely parse material content
  const parseMaterialContent = (content: string) => {
    if (!content) return { files: [], links: [] }
    
    try {
      // Try to parse as new structured format
      const parsed = JSON.parse(content)
      if (parsed.files && Array.isArray(parsed.files)) {
        return { files: parsed.files, links: parsed.links || [] }
      }
    } catch (e) {
      // If JSON parsing fails, try old format
      if (content.startsWith('FILES:')) {
        try {
          const filesPart = content.substring(6)
          // Find the end of the JSON by looking for the first non-JSON character
          let jsonEnd = filesPart.length
          for (let i = 0; i < filesPart.length; i++) {
            if (filesPart[i] === '\n' || filesPart[i] === '\r') {
              jsonEnd = i
              break
            }
          }
          const cleanJson = filesPart.substring(0, jsonEnd)
          const files = JSON.parse(cleanJson)
          return { files, links: [] }
        } catch (e2) {
          console.error('Error parsing old format content:', e2, 'Content:', content)
          return { files: [], links: [] }
        }
      }
    }
    
    return { files: [], links: [] }
  }

  // State variables
  const { 
    chapters, 
    loading: chaptersLoading, 
    error: chaptersError,
    createChapter, 
    updateChapter, 
    deleteChapter, 
    toggleChapterCompletion,
    reorderChapters 
  } = useChapters(subject.id)
  
  const { 
    materials: materialsFromHook, 
    loading: materialsLoading, 
    error: materialsError,
    createMaterial, 
    updateMaterial, 
    deleteMaterial, 
    toggleMaterialCompletion,
    reorderMaterials,
    refreshMaterials 
  } = useMaterials(undefined, subject.id)
  
  // Local materials state for immediate UI updates
  const [localMaterials, setLocalMaterials] = useState<Material[]>([])
  
  // Sync local state with hook state
  useEffect(() => {
    setLocalMaterials(materialsFromHook)
  }, [materialsFromHook])
  
  // Use local materials for rendering
  const materials = localMaterials

  const [newChapterName, setNewChapterName] = useState("")
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editingChapterName, setEditingChapterName] = useState("")
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null)
  const [dragOverChapterIndex, setDragOverChapterIndex] = useState<number | null>(null)
  const [newMaterialName, setNewMaterialName] = useState("")
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editingMaterialName, setEditingMaterialName] = useState("")
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [draggedMaterial, setDraggedMaterial] = useState<string | null>(null)
  const [dragOverMaterialIndex, setDragOverMaterialIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkDescription, setNewLinkDescription] = useState("")
  const [addingLinkToMaterial, setAddingLinkToMaterial] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [draggedFile, setDraggedFile] = useState<{ materialId: string; fileId: string } | null>(null)
  const [dragOverFileIndex, setDragOverFileIndex] = useState<{ materialId: string; index: number } | null>(null)
  const [editingFileName, setEditingFileName] = useState<{ materialId: string; fileId: string } | null>(null)
  const [editingFileNameText, setEditingFileNameText] = useState("")

  const createdDate = subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'Date not set'

  const completedChaptersCount = chapters.filter((chapter) => chapter.isCompleted).length
  const progressPercentage = chapters.length > 0 ? Math.round((completedChaptersCount / chapters.length) * 100) : 0

  const filteredMaterials = materials.filter((material) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      material.title.toLowerCase().includes(query) ||
      (material.content && material.content.toLowerCase().includes(query)) ||
      (material.fileUrl && material.fileUrl.toLowerCase().includes(query))
    )
  })

  // Add loading and error states
  if (chaptersLoading || materialsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Subject</DialogTitle>
            <DialogDescription>Please wait while we load the subject details...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading subject details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (chaptersError || materialsError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Subject</DialogTitle>
            <DialogDescription>There was an error loading the subject details. Please try again.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading subject details</p>
              {chaptersError && <p className="text-sm text-gray-600">{chaptersError}</p>}
              {materialsError && <p className="text-sm text-gray-600">{materialsError}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const addChapter = async () => {
    if (newChapterName.trim()) {
      try {
        await createChapter({
          subjectId: subject.id,
          title: newChapterName.trim(),
          order: chapters.length,
          description: ''
        })
      setNewChapterName("")
      } catch (error) {
        console.error('Failed to create chapter:', error)
      }
    }
  }

  const handleToggleChapterCompletion = async (chapterId: string) => {
    try {
      await toggleChapterCompletion(chapterId)
    } catch (error) {
      console.error('Failed to toggle chapter completion:', error)
    }
  }

  const updateChapterName = async (chapterId: string, newName: string) => {
    try {
      await updateChapter(chapterId, { title: newName })
    setEditingChapter(null)
    } catch (error) {
      console.error('Failed to update chapter name:', error)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await deleteChapter(chapterId)
    } catch (error) {
      console.error('Failed to delete chapter:', error)
    }
  }

  const handleChapterDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedChapter(chapterId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleChapterDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverChapterIndex(index)
  }

  const handleChapterDragLeave = () => {
    setDragOverChapterIndex(null)
  }

  const handleChapterDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedChapter) return

    const draggedIndex = chapters.findIndex((chapter) => chapter.id === draggedChapter)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedChapter(null)
      setDragOverChapterIndex(null)
      return
    }

    try {
      // Create the new order array
      const newOrder = chapters.map((chapter, index) => {
        if (index === draggedIndex) {
          return { id: chapter.id, order: dropIndex }
        } else if (index >= dropIndex && index < draggedIndex) {
          return { id: chapter.id, order: index + 1 }
        } else if (index <= dropIndex && index > draggedIndex) {
          return { id: chapter.id, order: index - 1 }
        } else {
          return { id: chapter.id, order: index }
        }
      })
      
      await reorderChapters(newOrder)
    } catch (error) {
      console.error('Failed to reorder chapters:', error)
    }
    
    setDraggedChapter(null)
    setDragOverChapterIndex(null)
  }

  const handleChapterDragEnd = () => {
    setDraggedChapter(null)
    setDragOverChapterIndex(null)
  }

  const addMaterial = async () => {
    if (newMaterialName.trim()) {
      try {
              const newMaterial = await createMaterial({
        chapterId: chapters[0]?.id || '', // Default to first chapter or empty string
        title: newMaterialName.trim(),
        type: 'OTHER',
        content: '',
        order: materials.length
      })
      
      if (newMaterial) {
        // Immediately add to local state for instant UI feedback
        setLocalMaterials(prev => [...prev, newMaterial])
      setNewMaterialName("")
      }
      } catch (error) {
        console.error('Failed to create material:', error)
      }
    }
  }

  const updateMaterialName = async (materialId: string, newName: string) => {
    try {
      const updatedMaterial = await updateMaterial(materialId, { title: newName })
      if (updatedMaterial) {
        // Immediately update local state for instant UI feedback
        setLocalMaterials(prev => prev.map(m => 
          m.id === materialId ? updatedMaterial : m
        ))
      }
    setEditingMaterial(null)
    } catch (error) {
      console.error('Failed to update material name:', error)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await deleteMaterial(materialId)
      // Immediately remove from local state for instant UI feedback
      setLocalMaterials(prev => prev.filter(m => m.id !== materialId))
    } catch (error) {
      console.error('Failed to delete material:', error)
    }
  }

  const handleMaterialDragStart = (e: React.DragEvent, materialId: string) => {
    console.log('Material drag start:', { materialId })
    setDraggedMaterial(materialId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleMaterialDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    console.log('Material drag over:', { index })
    setDragOverMaterialIndex(index)
  }

  const handleMaterialDragLeave = () => {
    setDragOverMaterialIndex(null)
  }

  const handleMaterialDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    console.log('Material drop:', { dropIndex, draggedMaterial })
    
    if (!draggedMaterial) {
      console.log('No dragged material')
      return
    }

    const draggedIndex = materials.findIndex((material) => material.id === draggedMaterial)
    console.log('Dragged index:', draggedIndex)
    
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      console.log('Invalid drop: same index or material not found')
      setDraggedMaterial(null)
      setDragOverMaterialIndex(null)
      return
    }

    try {
      // Create the new order array
      const newOrder = materials.map((material, index) => {
        if (index === draggedIndex) {
          return { id: material.id, order: dropIndex }
        } else if (index >= dropIndex && index < draggedIndex) {
          return { id: material.id, order: index + 1 }
        } else if (index <= dropIndex && index > draggedIndex) {
          return { id: material.id, order: index - 1 }
        } else {
          return { id: material.id, order: index }
        }
      })
      
      console.log('New order:', newOrder)
      await reorderMaterials(newOrder)
      console.log('Materials reordered successfully')
    } catch (error) {
      console.error('Failed to reorder materials:', error)
    }
    
    setDraggedMaterial(null)
    setDragOverMaterialIndex(null)
  }

  const handleMaterialDragEnd = () => {
    setDraggedMaterial(null)
    setDragOverMaterialIndex(null)
  }

  // File drag and drop functions
  const handleFileDragStart = (e: React.DragEvent, materialId: string, fileId: string) => {
    console.log('File drag start:', { materialId, fileId })
    setDraggedFile({ materialId, fileId })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFileDragOver = (e: React.DragEvent, materialId: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    console.log('File drag over:', { materialId, index })
    setDragOverFileIndex({ materialId, index })
  }

  const handleFileDragLeave = () => {
    setDragOverFileIndex(null)
  }

  const handleFileDrop = async (e: React.DragEvent, dropMaterialId: string, dropIndex: number) => {
    e.preventDefault()
    console.log('File drop:', { dropMaterialId, dropIndex, draggedFile })
    
    if (!draggedFile || draggedFile.materialId !== dropMaterialId) {
      console.log('Invalid drop: draggedFile or materialId mismatch')
      return
    }

    const currentMaterial = materials.find(m => m.id === dropMaterialId)
    if (!currentMaterial?.content) {
      console.log('Invalid drop: material has no content')
      return
    }

    try {
      let files: any[] = []
      let existingLinks: any[] = []
      
      // Try to parse as new structured format
      try {
        const parsed = JSON.parse(currentMaterial.content)
        if (parsed.files && Array.isArray(parsed.files)) {
          files = parsed.files
          existingLinks = parsed.links || []
        } else if (currentMaterial.content.startsWith('FILES:')) {
          // Handle old format
          files = JSON.parse(currentMaterial.content.substring(6))
          existingLinks = []
        } else {
          console.log('Invalid drop: material content format not supported')
          return
        }
      } catch (e) {
        // If JSON parsing fails, try old format
        if (currentMaterial.content.startsWith('FILES:')) {
          files = JSON.parse(currentMaterial.content.substring(6))
          existingLinks = []
        } else {
          console.log('Invalid drop: material content format not supported')
          return
        }
      }
      
      const draggedFileIndex = files.findIndex((file: any) => file.id === draggedFile.fileId)
      
      if (draggedFileIndex === -1 || draggedFileIndex === dropIndex) {
        setDraggedFile(null)
        setDragOverFileIndex(null)
        return
      }

      // Reorder files
      const [draggedFileItem] = files.splice(draggedFileIndex, 1)
      files.splice(dropIndex, 0, draggedFileItem)

      // Update material with reordered files
      let updatedMaterial
      if (currentMaterial.content.startsWith('FILES:')) {
        // Convert old format to new structured format
        updatedMaterial = await updateMaterial(dropMaterialId, {
          content: JSON.stringify({
            files: files,
            links: []
          })
        })
      } else {
        // Update with new structured format
        updatedMaterial = await updateMaterial(dropMaterialId, {
          content: JSON.stringify({
            files: files,
            links: existingLinks
          })
        })
      }

      console.log('Files reordered successfully')
      
      // Immediately update local state for instant UI feedback
      if (updatedMaterial) {
        setLocalMaterials(prev => prev.map(m => 
          m.id === dropMaterialId ? updatedMaterial : m
        ))
      }
    } catch (error) {
      console.error('Failed to reorder files:', error)
    } finally {
      setDraggedFile(null)
      setDragOverFileIndex(null)
    }
  }

  const handleFileDragEnd = () => {
    setDraggedFile(null)
    setDragOverFileIndex(null)
  }

  const updateFileName = async (materialId: string, fileId: string, newName: string) => {
    try {
      const currentMaterial = materials.find(m => m.id === materialId)
      if (!currentMaterial?.content) return

      try {
        // Try to parse as new structured format
        const parsed = JSON.parse(currentMaterial.content)
        if (parsed.files && Array.isArray(parsed.files)) {
          // New structured format
          const files = parsed.files
          const fileIndex = files.findIndex((file: any) => file.id === fileId)
          
          if (fileIndex !== -1) {
            files[fileIndex].name = newName
            
            const updatedMaterial = await updateMaterial(materialId, {
              content: JSON.stringify({
                files: files,
                links: parsed.links || []
              })
            })
            
            console.log('File name updated successfully')
            
            // Immediately update local state for instant UI feedback
            if (updatedMaterial) {
              setLocalMaterials(prev => prev.map(m => 
                m.id === materialId ? updatedMaterial : m
              ))
            }
          }
        } else if (currentMaterial.content.startsWith('FILES:')) {
          // Handle old format - convert to new structured format
          const files = JSON.parse(currentMaterial.content.substring(6))
          const fileIndex = files.findIndex((file: any) => file.id === fileId)
          
          if (fileIndex !== -1) {
            files[fileIndex].name = newName
            
            const updatedMaterial = await updateMaterial(materialId, {
              content: JSON.stringify({
                files: files,
                links: []
              })
            })
            
            console.log('File name updated successfully')
            
            // Immediately update local state for instant UI feedback
            if (updatedMaterial) {
              setLocalMaterials(prev => prev.map(m => 
                m.id === materialId ? updatedMaterial : m
              ))
            }
          }
        }
      } catch (e) {
        console.error('Error parsing content:', e)
      }
    } catch (error) {
      console.error('Failed to update file name:', error)
    }
  }

  const handleFileUpload = async (materialId: string, file: File) => {
    try {
      setUploadingFile(materialId)
      setUploadError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subjectId', subject.id)
      formData.append('category', 'MATERIAL')
      formData.append('description', `Uploaded for material: ${materials.find(m => m.id === materialId)?.title || 'Unknown'}`)
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }
      
      const result = await response.json()
      
      // Get current material to check existing files
      const currentMaterial = materials.find(m => m.id === materialId)
      let existingFiles = []
      let existingLinks = []
      
      console.log('Current material:', currentMaterial)
      console.log('Current material content:', currentMaterial?.content)
      
      // Parse existing content if available
      if (currentMaterial?.content) {
        try {
          // Try to parse as new structured format
          const parsed = JSON.parse(currentMaterial.content)
          if (parsed.files && Array.isArray(parsed.files)) {
            existingFiles = parsed.files
            existingLinks = parsed.links || []
          } else if (currentMaterial.content.startsWith('FILES:')) {
            // Handle old format
            existingFiles = JSON.parse(currentMaterial.content.substring(6))
            existingLinks = []
          }
        } catch (e) {
          // If JSON parsing fails, try old format
          if (currentMaterial.content.startsWith('FILES:')) {
            try {
              existingFiles = JSON.parse(currentMaterial.content.substring(6))
              existingLinks = []
            } catch (e2) {
              console.error('Error parsing existing files:', e2)
              existingFiles = []
              existingLinks = []
            }
          }
        }
      } else if (currentMaterial?.fileUrl) {
        // Handle backward compatibility - convert old single file to new format
        existingFiles = [{
          id: currentMaterial.id, // Use material ID as file ID for backward compatibility
          name: currentMaterial.fileUrl.split('/').pop() || 'Unknown file',
          url: currentMaterial.fileUrl,
          size: currentMaterial.fileSize || 0,
          type: 'application/octet-stream', // Default type
          uploadedAt: currentMaterial.createdAt || new Date().toISOString()
        }]
        existingLinks = []
        console.log('Converted old file format:', existingFiles)
      }
      
      // Add new file to the list
      const newFile = {
        id: result.file.id,
      name: file.name,
        url: `/api/files/${result.file.id}`,
      size: file.size,
      type: file.type,
        uploadedAt: new Date().toISOString()
      }
      
      existingFiles.push(newFile)
      console.log('Updated files list:', existingFiles)
      
      // Update the material with the new structured content
      const updatedMaterial = await updateMaterial(materialId, {
        content: JSON.stringify({
          files: existingFiles,
          links: existingLinks
        })
      })
      
      console.log('Material updated successfully:', updatedMaterial)
      console.log('File uploaded successfully:', result)
      
      // Immediately update local state for instant UI feedback
      setLocalMaterials(prev => prev.map(m => 
        m.id === materialId ? updatedMaterial : m
      ))
    } catch (error) {
      console.error('Failed to upload file:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setUploadingFile(null)
    }
  }



  const removeFileFromMaterial = async (materialId: string, fileId?: string) => {
    try {
      const currentMaterial = materials.find(m => m.id === materialId)
      
      if (fileId && currentMaterial?.content) {
        try {
          // Try to parse as new structured format
          const parsed = JSON.parse(currentMaterial.content)
          if (parsed.files && Array.isArray(parsed.files)) {
            // New structured format
            const updatedFiles = parsed.files.filter((file: any) => file.id !== fileId)
            const existingLinks = parsed.links || []
            
            let updatedMaterial
            if (updatedFiles.length === 0 && existingLinks.length === 0) {
              // No content left, clear the content
              updatedMaterial = await updateMaterial(materialId, { content: '' })
            } else {
              // Update with remaining files and links
              updatedMaterial = await updateMaterial(materialId, {
                content: JSON.stringify({
                  files: updatedFiles,
                  links: existingLinks
                })
              })
            }
            
            // Immediately update local state for instant UI feedback
            if (updatedMaterial) {
              setLocalMaterials(prev => prev.map(m => 
                m.id === materialId ? updatedMaterial : m
              ))
            }
          } else if (currentMaterial.content.startsWith('FILES:')) {
            // Handle old format - convert to new structured format
            const files = JSON.parse(currentMaterial.content.substring(6))
            const updatedFiles = files.filter((file: any) => file.id !== fileId)
            
            let updatedMaterial
            if (updatedFiles.length === 0) {
              // No files left, clear the content
              updatedMaterial = await updateMaterial(materialId, { content: '' })
            } else {
              // Update with remaining files in new structured format
              updatedMaterial = await updateMaterial(materialId, {
                content: JSON.stringify({
                  files: updatedFiles,
                  links: []
                })
              })
            }
            
            // Immediately update local state for instant UI feedback
            if (updatedMaterial) {
              setLocalMaterials(prev => prev.map(m => 
                m.id === materialId ? updatedMaterial : m
              ))
            }
          }
        } catch (e) {
          console.error('Error parsing content:', e)
        }
      } else {
        // Remove single file (backward compatibility)
        const updatedMaterial = await updateMaterial(materialId, {
          fileUrl: '',
          fileSize: 0
        })
        
        // Immediately update local state for instant UI feedback
        if (updatedMaterial) {
          setLocalMaterials(prev => prev.map(m => 
            m.id === materialId ? updatedMaterial : m
          ))
        }
      }
      
      console.log('File removed successfully from material:', materialId)
    } catch (error) {
      console.error('Failed to remove file from material:', error)
    }
  }

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const addLinkToMaterial = async (materialId: string) => {
    if (newLinkUrl.trim() && newLinkDescription.trim()) {
      try {
        // Get current material to preserve existing files
        const currentMaterial = materials.find(m => m.id === materialId)
        let newContent = ''
        
        if (currentMaterial?.content) {
          try {
            // Try to parse as new structured format
            const parsed = JSON.parse(currentMaterial.content)
            if (parsed.files && Array.isArray(parsed.files)) {
              // New structured format - preserve existing files and add link
              newContent = JSON.stringify({
                files: parsed.files,
                links: [...(parsed.links || []), {
                  description: newLinkDescription,
                  url: newLinkUrl
                }]
              })
            } else if (currentMaterial.content.startsWith('FILES:')) {
              // Handle old format - extract files and add link
              try {
                const filesPart = currentMaterial.content.substring(6)
                // Find the end of the JSON by looking for the first non-JSON character
                let jsonEnd = filesPart.length
                for (let i = 0; i < filesPart.length; i++) {
                  if (filesPart[i] === '\n' || filesPart[i] === '\r') {
                    jsonEnd = i
                    break
                  }
                }
                const cleanJson = filesPart.substring(0, jsonEnd)
                const existingFiles = JSON.parse(cleanJson)
                
                newContent = JSON.stringify({
                  files: existingFiles,
                  links: [{
                    description: newLinkDescription,
                    url: newLinkUrl
                  }]
                })
              } catch (e2) {
                console.error('Error parsing old format files:', e2)
                // Fallback: just add the link
                newContent = JSON.stringify({
                  files: [],
                  links: [{
                    description: newLinkDescription,
                    url: newLinkUrl
                  }]
                })
              }
            } else {
              // Unknown format - just add the link
              newContent = JSON.stringify({
                files: [],
                links: [{
                  description: newLinkDescription,
                  url: newLinkUrl
                }]
              })
            }
          } catch (e) {
            console.error('Error parsing existing content:', e)
            // Fallback: just add the link
            newContent = JSON.stringify({
              files: [],
              links: [{
                description: newLinkDescription,
                url: newLinkUrl
              }]
            })
          }
        } else if (currentMaterial?.fileUrl) {
          // Convert old format to new structured format
          const files = [{
            id: currentMaterial.id,
            name: currentMaterial.fileUrl.split('/').pop() || 'Unknown file',
            url: currentMaterial.fileUrl,
            size: currentMaterial.fileSize || 0,
            type: currentMaterial.type || 'application/octet-stream',
            uploadedAt: currentMaterial.createdAt || new Date().toISOString()
          }]
          newContent = JSON.stringify({
            files: files,
            links: [{
              description: newLinkDescription,
              url: newLinkUrl
            }]
          })
        } else {
          // No existing content, just add link
          newContent = JSON.stringify({
            files: [],
            links: [{
              description: newLinkDescription,
              url: newLinkUrl
            }]
          })
        }
        
        console.log('Adding link to material. New content:', newContent)
        console.log('Current material before update:', currentMaterial)
        console.log('Files to preserve:', currentMaterial?.content ? 'Will be extracted' : 'None')
        
        // Update the material with the new content
        const updatedMaterial = await updateMaterial(materialId, {
          content: newContent
        })
        
        console.log('Updated material after adding link:', updatedMaterial)
        
      setNewLinkUrl("")
      setNewLinkDescription("")
      setAddingLinkToMaterial(null)
        
        console.log('Link added successfully to material:', materialId)
        
        // Immediately update local state for instant UI feedback
        if (updatedMaterial) {
          setLocalMaterials(prev => prev.map(m => 
            m.id === materialId ? updatedMaterial : m
          ))
        }
      } catch (error) {
        console.error('Failed to add link to material:', error)
      }
    }
  }

  const removeLinkFromMaterial = async (materialId: string) => {
    try {
      // Get current material to preserve existing files
      const currentMaterial = materials.find(m => m.id === materialId)
      let newContent = ''
      
      if (currentMaterial?.content) {
        try {
          // Try to parse as new structured format
          const parsed = JSON.parse(currentMaterial.content)
          if (parsed.files && parsed.links) {
            // Remove all links, keep only files
            newContent = JSON.stringify({
              files: parsed.files,
              links: []
            })
          } else {
            // Old format, preserve as is
            newContent = currentMaterial.content
          }
        } catch (e) {
          // Not valid JSON, treat as old format
          if (currentMaterial.content.startsWith('FILES:')) {
            // Extract only the files part
            const filesPart = currentMaterial.content.split('\n\nLINK:')[0]
            newContent = filesPart
          } else if (currentMaterial.content.startsWith('LINK:')) {
            // Only link content, remove everything
            newContent = ''
          } else {
            // Mixed content, try to preserve files
            const parts = currentMaterial.content.split('\n\nLINK:')
            if (parts[0].startsWith('FILES:')) {
              newContent = parts[0]
            } else {
              newContent = ''
            }
          }
        }
      }
      
      // Update the material with the new content
      const updatedMaterial = await updateMaterial(materialId, {
        content: newContent
      })
      
      console.log('Link removed successfully from material:', materialId)
      
      // Immediately update local state for instant UI feedback
      if (updatedMaterial) {
        setLocalMaterials(prev => prev.map(m => 
          m.id === materialId ? updatedMaterial : m
        ))
      }
    } catch (error) {
      console.error('Failed to remove link from material:', error)
    }
  }

  const openLink = (url: string) => {
    window.open(url.startsWith("http") ? url : `https://${url}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className={`h-4 w-4 rounded-full ${subject.color}`} />
            <DialogTitle className="text-xl">{subject.name}</DialogTitle>
          </div>
          <DialogDescription>{subject.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="materials">Materials & Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-4">
              <h3 className="flex items-center space-x-2 text-lg font-semibold">
                <Target className="h-5 w-5 text-primary" />
                <span>Progress Overview</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">{completedChaptersCount} chapters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium">{chapters.length - completedChaptersCount} chapters</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center space-x-2 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Subject Information</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{createdDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Chapters:</span>
                  <p className="font-medium">{chapters.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{materials.length}</div>
                  <div className="text-xs text-muted-foreground">Materials</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-2">{chapters.length}</div>
                  <div className="text-xs text-muted-foreground">Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-3">
                    {materials.filter(m => m.fileUrl).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chapters" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-lg font-semibold">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <span>Chapters</span>
                </h3>
                <div className="text-sm text-muted-foreground">
                  {completedChaptersCount} of {chapters.length} completed
                </div>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add new chapter (e.g., Introduction, Chapter 1, etc.)"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addChapter()}
                />
                <Button onClick={addChapter} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {chapters.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {chapters.length > 0 ? (
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`border rounded-lg p-3 transition-all ${
                        draggedChapter === chapter.id ? "opacity-50 scale-95" : ""
                      } ${dragOverChapterIndex === index ? "ring-2 ring-primary ring-offset-2" : ""} ${
                        chapter.isCompleted ? "bg-muted/30" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleChapterDragStart(e, chapter.id)}
                      onDragOver={(e) => handleChapterDragOver(e, index)}
                      onDragLeave={handleChapterDragLeave}
                      onDrop={(e) => handleChapterDrop(e, index)}
                      onDragEnd={handleChapterDragEnd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Checkbox
                            checked={chapter.isCompleted}
                            onCheckedChange={() => handleToggleChapterCompletion(chapter.id)}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white border-2 border-gray-400 dark:border-gray-600 w-5 h-5"
                          />
                          {editingChapter === chapter.id ? (
                            <Input
                              value={editingChapterName}
                              onChange={(e) => setEditingChapterName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") updateChapterName(chapter.id, editingChapterName)
                                if (e.key === "Escape") setEditingChapter(null)
                              }}
                              onBlur={() => updateChapterName(chapter.id, editingChapterName)}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`font-medium ${chapter.isCompleted ? "line-through text-muted-foreground" : ""}`}
                            >
                              {chapter.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingChapter(chapter.id)
                              setEditingChapterName(chapter.title)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteChapter(chapter.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chapters added yet.</p>
                  <p className="text-sm">Add chapters to track your progress through this subject.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-lg font-semibold">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Study Materials & Files</span>
                </h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials and files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add new material (e.g., Textbook, Notes, Video)"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addMaterial()}
                />
                <Button onClick={addMaterial} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>



              {filteredMaterials.length > 0 ? (
                <div className="space-y-3">
                  {filteredMaterials.map((material, index) => (
                    <div
                      key={material.id}
                      className={`border rounded-lg p-4 space-y-3 transition-all ${
                        draggedMaterial === material.id ? "opacity-50 scale-95" : ""
                      } ${dragOverMaterialIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      draggable
                      onDragStart={(e) => handleMaterialDragStart(e, material.id)}
                      onDragOver={(e) => handleMaterialDragOver(e, index)}
                      onDragLeave={handleMaterialDragLeave}
                      onDrop={(e) => handleMaterialDrop(e, index)}
                      onDragEnd={handleMaterialDragEnd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground transition-opacity" />
                          </div>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {editingMaterial === material.id ? (
                            <Input
                              value={editingMaterialName}
                              onChange={(e) => setEditingMaterialName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") updateMaterialName(material.id, editingMaterialName)
                                if (e.key === "Escape") setEditingMaterial(null)
                              }}
                              onBlur={() => updateMaterialName(material.id, editingMaterialName)}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{material.title}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMaterial(material.id)
                              setEditingMaterialName(material.title)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(material.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Display files */}
                      {(() => {
                        // Get files using the utility function
                        const { files, links } = parseMaterialContent(material.content || '')
                        
                        // Handle backward compatibility for old fileUrl format
                        if (files.length === 0 && material.fileUrl) {
                          const convertedFiles = [{
                            id: material.id,
                            name: material.fileUrl.split('/').pop() || 'Unknown file',
                            url: material.fileUrl,
                            size: material.fileSize || 0,
                            type: material.type || 'application/octet-stream',
                            uploadedAt: material.createdAt || new Date().toISOString()
                          }]
                          console.log('Converted old fileUrl format to files:', convertedFiles.length)
                          return (
                        <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Files: {convertedFiles.length} file(s)
                              </p>
                              {convertedFiles.map((file: any, index: number) => (
                                <div 
                                  key={file.id} 
                                  className="bg-muted/50 rounded-md p-3 transition-all"
                                >
                              <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {/* Show thumbnail if available */}
                                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center shadow-sm border">
                                        {/* For images, show the actual image as thumbnail */}
                                        {file.type.startsWith('image/') ? (
                                          <img
                                            src={file.url}
                                            alt="File thumbnail"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : file.type === 'application/pdf' ? (
                                          <PDFThumbnail
                                            documentId={file.id}
                                            fileUrl={file.url}
                                            className="w-full h-full"
                                          />
                                        ) : (
                                          getFileIcon(file.type)
                                        )}
                                      </div>
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                      <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                      <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                                    <Download className="h-3 w-3" />
                                  </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                        
                        if (files.length === 0) return null
                        
                        return (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Files: {files.length} file(s)
                            </p>
                            {files.map((file: any, index: number) => (
                              <div 
                                key={file.id} 
                                className={`bg-muted/50 rounded-md p-3 transition-all ${
                                  draggedFile?.fileId === file.id ? "opacity-50 scale-95" : ""
                                } ${dragOverFileIndex?.materialId === material.id && dragOverFileIndex?.index === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                draggable
                                onDragStart={(e) => handleFileDragStart(e, material.id, file.id)}
                                onDragOver={(e) => handleFileDragOver(e, material.id, index)}
                                onDragLeave={handleFileDragLeave}
                                onDrop={(e) => handleFileDrop(e, material.id, index)}
                                onDragEnd={handleFileDragEnd}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {/* Drag handle */}
                                    <div className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                                      <GripVertical className="h-3 w-3 text-muted-foreground transition-opacity" />
                                    </div>
                                    
                                    {/* Show thumbnail if available */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center shadow-sm border">
                                      {/* For images, show the actual image as thumbnail */}
                                      {file.type.startsWith('image/') ? (
                                        <img
                                          src={file.url}
                                          alt="File thumbnail"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : file.type === 'application/pdf' ? (
                                        <PDFThumbnail
                                          documentId={file.id}
                                          fileUrl={file.url}
                                          className="w-full h-full"
                                        />
                                      ) : (
                                        getFileIcon(file.type)
                                      )}
                                    </div>
                                    <div>
                                      {editingFileName?.materialId === material.id && editingFileName?.fileId === file.id ? (
                                        <Input
                                          value={editingFileNameText}
                                          onChange={(e) => setEditingFileNameText(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                              updateFileName(material.id, file.id, editingFileNameText)
                                              setEditingFileName(null)
                                            }
                                            if (e.key === "Escape") setEditingFileName(null)
                                          }}
                                          onBlur={() => {
                                            updateFileName(material.id, file.id, editingFileNameText)
                                            setEditingFileName(null)
                                          }}
                                          className="h-6 text-sm"
                                          autoFocus
                                        />
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          <p 
                                            className="text-sm font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                            onClick={() => {
                                              setEditingFileName({ materialId: material.id, fileId: file.id })
                                              setEditingFileNameText(file.name)
                                            }}
                                          >
                                            {file.name}
                                          </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                            className="h-4 w-4 p-0 hover:bg-muted/50"
                                            onClick={() => {
                                              setEditingFileName({ materialId: material.id, fileId: file.id })
                                              setEditingFileNameText(file.name)
                                            }}
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(file.uploadedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeFileFromMaterial(material.id, file.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        )
                      })()}
                      
                      {/* Display links if available */}
                      {(() => {
                        // Get links using the utility function
                        const { files, links } = parseMaterialContent(material.content || '')
                        
                        if (links.length === 0) return null
                        
                        return (
                          <div className="space-y-2 mt-3">
                            <p className="text-sm font-medium text-muted-foreground">Links:</p>
                            {links.map((link: any, index: number) => (
                              <div key={index} className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <p className="text-sm font-medium">{link.description}</p>
                                      <p className="text-xs text-blue-600 dark:text-blue-400">
                                        <button
                                          onClick={() => openLink(link.url)}
                                          className="hover:underline cursor-pointer"
                                        >
                                      {link.url}
                                        </button>
                                    </p>
                                  </div>
                                </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLinkFromMaterial(material.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        )
                      })()}



                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4">
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload files or add content
                            </p>
                            <div className="flex space-x-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                                onClick={() => document.getElementById(`file-upload-${material.id}`)?.click()}
                                disabled={uploadingFile === material.id}
                              >
                                {uploadingFile === material.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  'Choose File'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAddingLinkToMaterial(material.id)}
                                disabled={uploadingFile === material.id}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Link
                            </Button>
                          </div>
                            {uploadError && uploadingFile === material.id && (
                              <p className="text-xs text-red-600 mt-2">{uploadError}</p>
                            )}
                            {uploadingFile === material.id && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                                <p className="text-xs text-gray-600 mt-1">Uploading file...</p>
                              </div>
                            )}
                            <input
                              id={`file-upload-${material.id}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(material.id, file)
                              }}
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp4,.mp3"
                            />
                            
                            {/* Link input dialog */}
                            {addingLinkToMaterial === material.id && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <div className="space-y-2">
                              <Input
                                    placeholder="Link description (e.g., 'Course Notes')"
                                value={newLinkDescription}
                                onChange={(e) => setNewLinkDescription(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Input
                                    placeholder="URL (e.g., https://example.com)"
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addLinkToMaterial(material.id)}
                                disabled={!newLinkUrl.trim() || !newLinkDescription.trim()}
                              >
                                Add Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAddingLinkToMaterial(null)
                                  setNewLinkUrl("")
                                  setNewLinkDescription("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchQuery ? (
                    <>
                      <p>No materials found matching "{searchQuery}"</p>
                      <p className="text-sm">Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <p>No study materials added yet.</p>
                      <p className="text-sm">Add materials like textbooks, notes, or videos above.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>


        </Tabs>

        {previewFile && (
          <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{previewFile.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {previewFile.type.startsWith("image/") ? (
                  <img
                    src={previewFile.url || "/placeholder.svg"}
                    alt={previewFile.name}
                    className="w-full rounded-md"
                  />
                ) : previewFile.type.includes("pdf") ? (
                  <iframe src={previewFile.url} className="w-full h-96 rounded-md" />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Preview not available for this file type.</p>
                    <Button onClick={() => downloadFile(previewFile)} className="mt-4">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
