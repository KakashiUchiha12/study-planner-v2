"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderOpen, FileText, ImageIcon, File, Download, Eye, Trash2, Pin, GripVertical, Upload, MoreHorizontal, Edit } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PDFThumbnail } from '@/components/pdf-thumbnail'
import { FileThumbnail } from '@/components/file-thumbnail'

export interface DocumentCard {
  id: string
  name: string
  originalName: string
  description?: string
  type: string
  mimeType: string
  size: number
  filePath: string
  thumbnailPath?: string
  category: string
  tags: string
  isPinned: boolean
  order: number
  userId: string
  createdAt: Date
  updatedAt: Date
  uploadedAt: Date
}

interface DocumentsTabProps {
  documents: DocumentCard[]
  onUploadDocument: (file: File) => Promise<DocumentCard>
  onUpdateDocument: (docId: string, data: any) => Promise<void>
  onDeleteDocument: (docId: string) => Promise<void>
  onTogglePin: (docId: string) => Promise<DocumentCard>
  onReorderDocuments: (docIds: string[]) => Promise<void>
}

// Sortable Document Card Component
function SortableDocumentCard({ 
  document, 
  onUpdate, 
  onDelete, 
  onTogglePin 
}: {
  document: DocumentCard
  onUpdate: (docId: string, data: any) => Promise<DocumentCard>
  onDelete: (docId: string, docName: string) => void
  onTogglePin: (docId: string) => Promise<DocumentCard>
}) {
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(document.name)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Close edit menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEditMenu && !event.target) {
        setShowEditMenu(false)
      }
    }

    globalThis.document.addEventListener('mousedown', handleClickOutside)
    return () => {
      globalThis.document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEditMenu])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFileIcon = (mimeType: string | undefined | null) => {
    if (!mimeType) return <File className="h-8 w-8 text-gray-600" />
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-600" />
    if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-600" />
    return <File className="h-8 w-8 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'personal': return 'bg-green-100 text-green-800'
      case 'work': return 'bg-purple-100 text-purple-800'
      case 'research': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEditName = async () => {
    if (editName.trim() && editName !== document.name) {
      try {
        await onUpdate(document.id, { name: editName.trim() })
        setIsEditing(false)
        // Pass the updated document back to the parent
        // This will be handled by the parent's handleUpdateDocument
      } catch (error) {
        console.error('Failed to update document name:', error)
        setEditName(document.name) // Reset on error
      }
    } else {
      setIsEditing(false)
      setEditName(document.name)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(document.name)
  }

  return (
    <div ref={setNodeRef} style={style} className="relative w-full">
      <div className={`bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 w-full h-96 group ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
      }`}>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 cursor-grab active:cursor-grabbing z-10 opacity-100 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 rounded p-1.5"
        >
          <GripVertical className="h-4 w-4 text-slate-600" />
        </div>

        <div className="pt-8 h-full flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      ref={editInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditName()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleEditName}
                      className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-8 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-slate-800 truncate flex-1" title={document.name}>
                      {document.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditMenu(!showEditMenu)}
                      className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex-shrink-0"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {document.isPinned && (
                  <Pin className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                )}
              </div>

              {/* Edit Menu */}
              {showEditMenu && !isEditing && (
                <div className="absolute top-16 left-4 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-32">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setShowEditMenu(false)
                        setTimeout(() => editInputRef.current?.focus(), 100)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      Edit Name
                    </button>
                    <button
                      onClick={() => {
                        onTogglePin(document.id)
                        setShowEditMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pin className="h-3 w-3" />
                      {document.isPinned ? 'Unpin' : 'Pin'} Document
                    </button>
                    <button
                      onClick={() => {
                        onDelete(document.id, document.name)
                        setShowEditMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {document.description && (
                <p className="text-slate-600 text-sm mb-2 overflow-hidden text-ellipsis display-webkit-box -webkit-line-clamp-2 -webkit-box-orient-vertical" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {document.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(document.category)}`}>
                  {document.category}
                </span>
                {(() => {
                  try {
                    const tagsArray = typeof document.tags === 'string' ? JSON.parse(document.tags || '[]') : (document.tags || [])
                    return tagsArray.slice(0, 2).map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-600 truncate max-w-20" title={tag}>
                        {tag}
                      </span>
                    ))
                  } catch (e) {
                    return null
                  }
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/documents/${document.id}/regenerate-thumbnail`, {
                      method: 'POST',
                      credentials: 'include'
                    })
                    if (response.ok) {
                      // Refresh the page to show new thumbnails
                      window.location.reload()
                    }
                  } catch (error) {
                    console.error('Failed to regenerate thumbnail:', error)
                  }
                }}
                className="h-8 w-8 p-0 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors"
                title="Regenerate thumbnail"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 flex flex-col items-center space-y-2 mb-3">
            <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200">
              {document.thumbnailPath && document.thumbnailPath.startsWith('/api/') ? (
                <img
                  src={document.thumbnailPath}
                  alt="Document thumbnail"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Thumbnail failed to load:', e, 'URL:', document.thumbnailPath)
                    // Fallback to direct file preview if thumbnail fails
                    // We'll handle this by updating the document to remove the thumbnail path
                    // so it falls back to the next condition
                  }}
                  onLoad={() => console.log('Thumbnail loaded successfully:', document.thumbnailPath)}
                />
              ) : document.mimeType && document.mimeType.startsWith('image/') ? (
                <img
                  src={`/api/documents/${document.id}/file`}
                  alt="Document preview"
                  className="w-full h-full object-contain"
                  onError={(e) => console.error('Image failed to load:', e, 'URL:', `/api/documents/${document.id}/file`)}
                  onLoad={() => console.log('Image loaded successfully:', `/api/documents/${document.id}/file`)}
                />
              ) : document.mimeType === 'application/pdf' ? (
                <PDFThumbnail
                  documentId={document.id}
                  fileUrl={`/api/documents/${document.id}/file`}
                  className="w-full h-full"
                />
              ) : (
                <FileThumbnail
                  fileUrl={`/api/documents/${document.id}/file`}
                  fileName={document.originalName}
                  fileType={document.mimeType}
                  className="w-full h-full"
                />
              )}
            </div>
            
            <div className="w-full space-y-1 text-center">
              <div className="text-xs text-slate-500">
                <span className="font-medium">Type:</span> {document.type}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-medium">Size:</span> {formatFileSize(document.size)}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-medium">Added:</span> {new Date(document.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const url = `/api/documents/${document.id}/file`
                console.log('Opening document preview:', url)
                // Open in new window (not tab) with specific dimensions
                window.open(url, 'documentPreview', 'width=1000,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no')
              }}
              className="flex-1 h-8 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const url = `/api/documents/${document.id}/file?download=true`
                console.log('Downloading document:', document.originalName || document.name)
                // Direct navigation to download URL with proper headers
                window.location.href = url
              }}
              className="flex-1 h-8 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DocumentsTab({
  documents,
  onUploadDocument,
  onUpdateDocument,
  onDeleteDocument,
  onTogglePin,
  onReorderDocuments
}: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; documentId: string | null; documentName: string }>({
    show: false,
    documentId: null,
    documentName: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Local state for documents to handle optimistic updates
  const [localDocuments, setLocalDocuments] = useState<DocumentCard[]>(documents)

  // Update local documents when props change, but preserve reordering
  useEffect(() => {
    // Only update if the documents array has actually changed (new documents added/removed)
    // Don't reset if we just have the same documents in a different order
    const hasNewDocuments = documents.length !== localDocuments.length || 
      documents.some(doc => !localDocuments.find(local => local.id === doc.id)) ||
      localDocuments.some(local => !documents.find(doc => doc.id === local.id))
    
    if (hasNewDocuments) {
      console.log('Updating local documents due to new/deleted documents')
      setLocalDocuments(documents)
    } else {
      console.log('Preserving local document order - no new/deleted documents')
    }
  }, [documents, localDocuments.length])

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Handle documents drag end
  const handleDocumentsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('Drag end event:', { active: active.id, over: over?.id })

    if (active.id !== over?.id && over) {
      const oldIndex = localDocuments.findIndex((item) => item.id === active.id)
      const newIndex = localDocuments.findIndex((item) => item.id === over.id)
      
      console.log('Reordering documents:', { oldIndex, newIndex, activeId: active.id, overId: over.id })
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          // Create new array with reordered documents
          const reorderedDocuments = [...localDocuments]
          const [movedDocument] = reorderedDocuments.splice(oldIndex, 1)
          reorderedDocuments.splice(newIndex, 0, movedDocument)
          
          // Optimistically update the local state immediately
          setLocalDocuments(reorderedDocuments)
          
          // Update the backend
          const documentIds = reorderedDocuments.map(d => d.id)
          console.log('Calling onReorderDocuments with:', documentIds)
          await onReorderDocuments(documentIds)
          console.log('Documents reordered successfully')
        } catch (error) {
          console.error('Error reordering documents:', error)
          // Revert optimistic update on error
          setLocalDocuments(documents)
        }
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setUploadError(null)
      const newDocument = await onUploadDocument(file)
      
      // Update local documents state with the new document
      if (newDocument) {
        setLocalDocuments(prev => [...prev, newDocument])
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteClick = (documentId: string, documentName: string) => {
    setDeleteConfirm({
      show: true,
      documentId,
      documentName
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.documentId) {
      await onDeleteDocument(deleteConfirm.documentId)
      // Update local state to remove the deleted document
      setLocalDocuments(prev => prev.filter(doc => doc.id !== deleteConfirm.documentId))
      setDeleteConfirm({ show: false, documentId: null, documentName: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, documentId: null, documentName: '' })
  }

  const handleUpdateDocument = async (docId: string, data: any) => {
    try {
      await onUpdateDocument(docId, data)
      // Update local state with the updated document
      // Since onUpdateDocument returns void, we'll update the local state manually
      setLocalDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, ...data } : doc
      ))
      // Return the updated document from local state
      const updatedDoc = localDocuments.find(doc => doc.id === docId)
      const fallbackDoc = documents.find(doc => doc.id === docId)
      if (!updatedDoc && !fallbackDoc) {
        throw new Error('Document not found')
      }
      return updatedDoc || fallbackDoc!
    } catch (error) {
      console.error('Failed to update document:', error)
      throw error
    }
  }

  const handleTogglePin = async (docId: string) => {
    try {
      await onTogglePin(docId)
      // Update local state
      setLocalDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, isPinned: !doc.isPinned } : doc
      ))
      // Return the updated document from local state
      const updatedDoc = localDocuments.find(doc => doc.id === docId)
      const fallbackDoc = documents.find(doc => doc.id === docId)
      if (!updatedDoc && !fallbackDoc) {
        throw new Error('Document not found')
      }
      return updatedDoc || fallbackDoc!
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-800">Upload Documents</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-6 text-sm font-medium"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />
          {uploadError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      {/* All Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-purple-600" />
          Documents ({localDocuments.length})
        </h3>
        
        {localDocuments.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDocumentsDragEnd}
            onDragStart={() => console.log('Drag started')}
            onDragOver={() => console.log('Drag over')}
          >
            <SortableContext
              items={localDocuments.map(d => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {localDocuments
                  .sort((a, b) => {
                    // Sort pinned documents first, then by order
                    if (a.isPinned && !b.isPinned) return -1
                    if (!a.isPinned && b.isPinned) return 1
                    return a.order - b.order
                  })
                  .map((document) => (
                    <SortableDocumentCard
                      key={document.id}
                      document={document}
                      onUpdate={handleUpdateDocument}
                      onDelete={handleDeleteClick}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No documents yet</h3>
            <p className="text-slate-500 mb-4">Start by uploading your first document</p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Delete Document</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{deleteConfirm.documentName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
