"use client"

import { useEffect, useState } from "react"
import { FileText, Image as ImageIcon, FileSpreadsheet, FileText as WordIcon } from "lucide-react"

// Import PDF.js only on client side to prevent SSR issues
let pdfjsLib: any = null

if (typeof window !== 'undefined') {
  import('pdfjs-dist/legacy/build/pdf.js').then((lib) => {
    pdfjsLib = lib
    // Set the worker source for PDF.js
    lib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`
  })
}

interface FileThumbnailProps {
  file: {
    name: string
    type: string
    size: number
    url: string
    thumbnail?: string
    // Add support for File objects from mock uploads
    fileObject?: File
  }
  className?: string
}

export function FileThumbnail({ file, className = "" }: FileThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    generateThumbnail()
  }, [file])

  const generateThumbnail = async () => {
    setIsGenerating(true)
    
    try {
      // Check if we have a File object (from mock uploads)
      if (file.fileObject && file.fileObject instanceof File) {
        if (file.fileObject.type.startsWith('image/')) {
          // Create object URL for local files
          const objectUrl = URL.createObjectURL(file.fileObject)
          setThumbnailUrl(objectUrl)
          setIsGenerating(false)
          return
        }
      }
      
      if (file.type.startsWith('image/')) {
        // For images, use the image itself as thumbnail
        setThumbnailUrl(file.url)
        setIsGenerating(false)
      } else if (file.type === 'application/pdf') {
        // For PDFs, render the actual first page
        await renderPDFFirstPage()
      } else if (file.type.startsWith('text/')) {
        // For text files, create a styled preview
        createTextThumbnail()
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // For Word documents, create a styled preview
        createWordThumbnail()
      } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
        // For Excel files, create a styled preview
        createExcelThumbnail()
      } else {
        // For other files, use appropriate icons
        setThumbnailUrl('')
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      // Fallback to icon-based thumbnail
      setThumbnailUrl('')
      setIsGenerating(false)
    }
  }

  const renderPDFFirstPage = async () => {
    // Only render PDF if we're on client side and have PDF.js
    if (!pdfjsLib || typeof window === 'undefined') {
      createStyledPDFThumbnail()
      return
    }

    try {
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(file.url)
      const pdf = await loadingTask.promise
      
      // Get the first page
      const page = await pdf.getPage(1)
      
      // Set viewport for thumbnail size
      const viewport = page.getViewport({ scale: 0.5 })
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas dimensions
        canvas.width = 120
        canvas.height = 90
        
        // Calculate scale to fit in thumbnail
        const scale = Math.min(120 / viewport.width, 90 / viewport.height)
        const scaledViewport = page.getViewport({ scale })
        
        // Set canvas size to match scaled viewport
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        
        // Render the page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas
        }
        
        await page.render(renderContext).promise
        
        // Convert to data URL and set as thumbnail
        setThumbnailUrl(canvas.toDataURL())
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error rendering PDF:', error)
      // Fallback to styled PDF thumbnail
      createStyledPDFThumbnail()
    }
  }

  const createStyledPDFThumbnail = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 120
      canvas.height = 90
      
      // Set background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 120, 90)
      
      // Draw PDF-style border
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(5, 5, 110, 80)
      
      // Draw PDF icon
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(15, 15, 20, 25)
      
      // Draw text lines to simulate PDF content
      ctx.fillStyle = '#374151'
      ctx.font = '8px Arial'
      ctx.textAlign = 'left'
      
      const lines = [
        'PDF',
        'Preview',
        'Page 1'
      ]
      
      lines.forEach((line, index) => {
        ctx.fillText(line, 40, 25 + (index * 10))
      })
      
      setThumbnailUrl(canvas.toDataURL())
      setIsGenerating(false)
    }
  }

  const createTextThumbnail = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 120
      canvas.height = 90
      
      // Set background
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, 120, 90)
      
      // Set text style
      ctx.fillStyle = '#495057'
      ctx.font = '8px monospace'
      ctx.textAlign = 'left'
      
      // Draw text content preview
      const lines = ['Text File', 'Content', 'Preview']
      lines.forEach((line, index) => {
        ctx.fillText(line.substring(0, 15), 10, 20 + (index * 12))
      })
      
      setThumbnailUrl(canvas.toDataURL())
      setIsGenerating(false)
    }
  }

  const createWordThumbnail = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 120
      canvas.height = 90
      
      // Set background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 120, 90)
      
      // Draw Word-style border
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 1
      ctx.strokeRect(5, 5, 110, 80)
      
      // Draw Word icon
      ctx.fillStyle = '#2563eb'
      ctx.fillRect(15, 15, 20, 25)
      
      // Draw text lines
      ctx.fillStyle = '#374151'
      ctx.font = '8px Arial'
      ctx.textAlign = 'left'
      
      const lines = [
        'Word',
        'Document',
        'Preview'
      ]
      
      lines.forEach((line, index) => {
        ctx.fillText(line, 40, 25 + (index * 10))
      })
      
      setThumbnailUrl(canvas.toDataURL())
      setIsGenerating(false)
    }
  }

  const createExcelThumbnail = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 120
      canvas.height = 90
      
      // Set background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 120, 90)
      
      // Draw Excel-style border
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 1
      ctx.strokeRect(5, 5, 110, 80)
      
      // Draw grid lines
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 0.5
      
      // Vertical lines
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath()
        ctx.moveTo(15 + (i * 20), 15)
        ctx.lineTo(15 + (i * 20), 75)
        ctx.stroke()
      }
      
      // Horizontal lines
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath()
        ctx.moveTo(15, 15 + (i * 15))
        ctx.lineTo(95, 15 + (i * 15))
        ctx.stroke()
      }
      
      // Draw some sample data
      ctx.fillStyle = '#374151'
      ctx.font = '7px Arial'
      ctx.textAlign = 'center'
      
      const data = [
        ['A1', 'B1'],
        ['A2', 'B2']
      ]
      
      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          ctx.fillText(cell, 25 + (colIndex * 20), 27 + (rowIndex * 15))
        })
      })
      
      setThumbnailUrl(canvas.toDataURL())
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className={`w-20 h-16 bg-muted/20 rounded-lg flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (thumbnailUrl) {
    return (
      <div className={`w-20 h-16 rounded-lg overflow-hidden border ${className}`}>
        <img 
          src={thumbnailUrl} 
          alt={`${file.name} thumbnail`}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Fallback to icon-based thumbnail
  return (
    <div className={`w-20 h-16 bg-muted/20 rounded-lg flex items-center justify-center ${className}`}>
      {file.type.startsWith('image/') && <ImageIcon className="h-6 w-6 text-blue-500" />}
      {file.type === 'application/pdf' && <FileText className="h-6 w-6 text-red-500" />}
      {file.type.startsWith('text/') && <FileText className="h-6 w-6 text-green-500" />}
      {file.type.includes('word') && <WordIcon className="h-6 w-6 text-blue-600" />}
      {file.type.includes('excel') && <FileSpreadsheet className="h-6 w-6 text-green-600" />}
      {!file.type.startsWith('image/') && !file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('excel') && 
        <FileText className="h-6 w-6 text-gray-500" />
      }
    </div>
  )
}
