import { useState } from "react"

interface FileData {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  uploadedAt?: Date
  category?: string
  description?: string
  isPublic?: boolean
  content?: string
}

export function useFilePreview() {
  const [previewFile, setPreviewFile] = useState<FileData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const openPreview = (file: FileData) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewFile(null)
  }

  return {
    previewFile,
    isPreviewOpen,
    openPreview,
    closePreview
  }
}
