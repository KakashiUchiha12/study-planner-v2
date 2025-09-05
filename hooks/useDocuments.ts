import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'
import { Document, CreateDocumentData, UpdateDocumentData } from '@/lib/database'

interface UseDocumentsReturn {
  documents: Document[]
  loading: boolean
  error: string | null
  uploadDocument: (file: File) => Promise<Document>
  updateDocument: (docId: string, data: UpdateDocumentData) => Promise<Document>
  deleteDocument: (docId: string) => Promise<void>
  toggleDocumentPin: (docId: string) => Promise<Document>
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
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
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
  }, [(session?.user as any)?.id, status])

  const uploadDocument = useCallback(async (file: File) => {
    // Only upload if user is authenticated
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
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
      return newDocument
    } catch (err) {
      console.error('Error uploading document:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [(session?.user as any)?.id, status])

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
      return updatedDocument
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
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: true }), // We'll toggle based on current state
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedDocument = await response.json()
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      ))
      return updatedDocument
    } catch (err) {
      console.error('Error toggling document pin:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reorderDocuments = useCallback(async (documentIds: string[]) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the reorder API
      const response = await fetch('/api/documents/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update the local state with the new order
      setDocuments(prev => {
        const reorderedDocuments = documentIds.map(id => prev.find(d => d.id === id)).filter(Boolean) as Document[]
        return reorderedDocuments
      })
      
    } catch (err) {
      console.error('Error reordering documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder documents')
      // Revert optimistic update by refreshing from database
      await fetchDocuments()
    } finally {
      setLoading(false)
    }
  }, [fetchDocuments])

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
