"use client"

import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useFilePreview } from "@/hooks/use-file-preview"

interface FilePreviewButtonProps {
  file: {
    id: string
    name: string
    type: string
    size: number
    url: string
    thumbnail?: string
    uploadedAt?: Date
    category?: string
    description?: string
  }
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
  className?: string
}

export function FilePreviewButton({ 
  file, 
  variant = "outline", 
  size = "sm",
  children,
  className
}: FilePreviewButtonProps) {
  const { openPreview } = useFilePreview()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => openPreview(file)}
      className={className}
    >
      <Eye className="h-4 w-4 mr-2" />
      {children || "Preview"}
    </Button>
  )
}
