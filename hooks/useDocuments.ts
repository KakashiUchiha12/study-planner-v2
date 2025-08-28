import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Document, CreateDocumentData, UpdateDocumentData } from '@/lib/database'

interface UseDocumentsReturn {
  documents: Document[]
  loading: boolean
  error: string | null
  uploadDocument: (file: File) => Promise<void>
  updateDocument: (docId: string, data: UpdateDocumentData) => Promise<void>
  deleteDocument: (docId: string) => Promise<void>
  toggleDocumentPin: (docId: string) => Promise<void>
  reorderDocuments: (docIds: string[]) => Promise<void>
  refreshDocuments: () => Promise<void>
}

export function useDocuments(): UseDocumentsReturn {
  const { data: session, status } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    // Only fetch if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/documents', {
        credentials: 'include' // Include session cookies
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setDocuments(data)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const uploadDocument = useCallback(async (file: File) => {
    // Only upload if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        credentials: 'include', // Include session cookies
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newDocument = await response.json()
      setDocuments(prev => [...prev, newDocument])
    } catch (err) {
      console.error('Error uploading document:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const updateDocument = useCallback(async (documentId: string, data: UpdateDocumentData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedDocument = await response.json()
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      ))
    } catch (err) {
      console.error('Error updating document:', err)
      setError(err instanceof Error ? err.message : 'Failed to update document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (err) {
      console.error('Error deleting document:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleDocumentPin = useCallback(async (documentId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const document = documents.find(d => d.id === documentId)
      if (!document) {
        throw new Error('Document not found')
      }
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !document.isPinned }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedDocument = await response.json()
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      ))
    } catch (err) {
      console.error('Error toggling document pin:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle document pin')
      throw err
    } finally {
      setLoading(false)
    }
  }, [documents])

  const reorderDocuments = useCallback(async (documentIds: string[]) => {
    try {
      setLoading(true)
      setError(null)
      
      // Optimistically update the UI
      const reorderedDocuments = documentIds.map(id => documents.find(d => d.id === id)).filter(Boolean) as Document[]
      setDocuments(reorderedDocuments)
      
      // TODO: Implement reorder API call when endpoint is available
      // const response = await fetch('/api/documents/reorder', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ documentIds }),
      // })
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`)
      // }
    } catch (err) {
      console.error('Error reordering documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder documents')
      // Revert optimistic update
      await fetchDocuments()
    } finally {
      setLoading(false)
    }
  }, [documents, fetchDocuments])

  const refreshDocuments = useCallback(async () => {
    await fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    toggleDocumentPin,
    reorderDocuments,
    refreshDocuments,
  }
}
