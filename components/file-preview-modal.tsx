'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FileText, Image, File, Download, ExternalLink, X, Maximize2, Minimize2 } from "lucide-react"

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    id: string
    name: string
    type: string
    url: string
    size: number
  } | null
}

export function FilePreviewModal({ open, onOpenChange, file }: FilePreviewModalProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [pdfLoadError, setPdfLoadError] = useState(false)
  
  console.log("🔍 FilePreviewModal render:", { open, file })

  const handleDownload = () => {
    if (file) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    if (file) {
      // Test the PDF URL first
      const pdfUrl = file.url.startsWith('http') 
        ? file.url 
        : new URL(file.url, window.location.origin).toString()
      
      console.log("🔍 Opening PDF in new tab:", pdfUrl)
      
      // Test if the URL works by fetching it first
      fetch(pdfUrl)
        .then(response => {
          console.log("🔍 PDF fetch response:", response.status, response.statusText)
          console.log("🔍 PDF content type:", response.headers.get('content-type'))
          if (response.ok) {
            window.open(pdfUrl, '_blank')
          } else {
            console.error("❌ PDF fetch failed:", response.status, response.statusText)
            // Still try to open it in case it's a browser issue
            window.open(pdfUrl, '_blank')
          }
        })
        .catch(error => {
          console.error("❌ PDF fetch error:", error)
          // Still try to open it
          window.open(pdfUrl, '_blank')
        })
    }
  }

  // Reset error states when file changes
  useEffect(() => {
    setPdfLoadError(false)
    if (file) {
      console.log("🔍 FilePreviewModal: File URL:", file.url)
      console.log("🔍 FilePreviewModal: Full URL would be:", new URL(file.url, window.location.origin).toString())
    }
  }, [file])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6 text-green-500" />
    if (type === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />
    if (type.includes('video/')) return <FileText className="h-6 w-6 text-purple-500" />
    if (type.includes('audio/')) return <FileText className="h-6 w-6 text-orange-500" />
    if (type.includes('wordprocessingml') || type === 'application/msword') return <FileText className="h-6 w-6 text-blue-600" />
    if (type.includes('spreadsheetml') || type === 'application/vnd.ms-excel') return <FileText className="h-6 w-6 text-green-600" />
    if (type.includes('presentationml') || type === 'application/vnd.ms-powerpoint') return <FileText className="h-6 w-6 text-red-600" />
    if (type.includes('text/')) return <FileText className="h-6 w-6 text-gray-600" />
    return <File className="h-6 w-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image'
    if (type === 'application/pdf') return 'PDF Document'
    if (type.includes('wordprocessingml')) return 'Word Document'
    if (type.includes('spreadsheetml')) return 'Excel Spreadsheet'
    if (type.includes('presentationml')) return 'PowerPoint Presentation'
    if (type.includes('text/')) return 'Text File'
    return 'File'
  }

  const canPreview = file && (
    file.type.startsWith('image/') || 
    file.type === 'application/pdf' ||
    file.type.includes('text/') ||
    file.type.includes('video/') ||
    file.type.includes('audio/') ||
    file.type.includes('wordprocessingml') ||
    file.type.includes('spreadsheetml') ||
    file.type.includes('presentationml') ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.ms-powerpoint' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    // Additional PowerPoint MIME types
    file.type === 'application/vnd.ms-powerpoint.presentation.macroEnabled.12' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.slide' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.template' ||
    // Check by file extension as fallback
    file.name.toLowerCase().endsWith('.ppt') ||
    file.name.toLowerCase().endsWith('.pptx') ||
    file.name.toLowerCase().endsWith('.doc') ||
    file.name.toLowerCase().endsWith('.docx') ||
    file.name.toLowerCase().endsWith('.xls') ||
    file.name.toLowerCase().endsWith('.xlsx')
  )

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMaximized ? 'max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh]' : 'max-w-7xl max-h-[85vh] w-[95vw] h-[85vh]'} overflow-hidden p-0 bg-white dark:bg-gray-900 flex flex-col`}>
        <DialogTitle className="sr-only">File Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview window for {file?.name || 'selected file'}
        </DialogDescription>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-7 w-7 p-0"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-7 px-2 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-white dark:bg-gray-900">
          {canPreview ? (
            <div className="w-full h-full">
              {file.type.startsWith('image/') ? (
                <div className="flex justify-center items-center h-full p-4">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : file.type === 'application/pdf' ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-blue-50 dark:bg-blue-800 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          PDF Viewer
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        Loading PDF content...
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative bg-white dark:bg-gray-900">
                    <iframe
                      src={`${file.url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH&sidebar=0`}
                      className="w-full h-full border-0"
                      title={file.name}
                      onLoad={() => {
                        console.log("✅ PDF loaded successfully")
                        setPdfLoadError(false)
                      }}
                      onError={() => {
                        console.log("❌ PDF iframe blocked, showing fallback")
                        setPdfLoadError(true)
                      }}
                    />
                    {/* Fallback for when iframe is blocked */}
                    {pdfLoadError && (
                      <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-8 max-w-md">
                          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-6 mb-6 mx-auto w-fit">
                            <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            PDF Ready to View
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                            Your PDF file is ready. Click below to download or open it in a new tab for the best viewing experience.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button 
                              onClick={handleDownload} 
                              size="sm"
                              className="px-4 py-2"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button 
                              onClick={handleOpenInNewTab} 
                              variant="outline"
                              size="sm"
                              className="px-4 py-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </Button>
                          </div>
                          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            {file.name} • {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : file.type.includes('text/') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-green-50 dark:bg-green-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Text Viewer
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <iframe
                      src={file.url}
                      className="w-full h-full border-0 rounded-lg"
                      title={file.name}
                    />
                  </div>
                </div>
              ) : file.type.includes('video/') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-purple-50 dark:bg-purple-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Video Player
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <video
                      src={file.url}
                      controls
                      className="w-full h-full object-contain rounded-lg"
                      title={file.name}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              ) : file.type.includes('audio/') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-orange-50 dark:bg-orange-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Audio Player
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="text-center">
                      <audio
                        src={file.url}
                        controls
                        className="w-full max-w-md"
                        title={file.name}
                      >
                        Your browser does not support the audio tag.
                      </audio>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        {file.name}
                      </p>
                    </div>
                  </div>
                </div>
              ) : file.type.includes('wordprocessingml') || file.type === 'application/msword' || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-blue-50 dark:bg-blue-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Word Document
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                      <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-6 mb-6 mx-auto w-fit">
                        <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Word Document
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        This Word document is ready to view. Click below to download or open it in a new tab for the best viewing experience.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button 
                          onClick={handleDownload} 
                          size="sm"
                          className="px-4 py-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Document
                        </Button>
                        <Button 
                          onClick={handleOpenInNewTab} 
                          variant="outline"
                          size="sm"
                          className="px-4 py-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        {file.name} • {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : file.type.includes('spreadsheetml') || file.type === 'application/vnd.ms-excel' || file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-green-50 dark:bg-green-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Excel Spreadsheet
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                      <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6 mb-6 mx-auto w-fit">
                        <FileText className="h-16 w-16 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Excel Spreadsheet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        This Excel spreadsheet is ready to view. Click below to download or open it in a new tab for the best viewing experience.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button 
                          onClick={handleDownload} 
                          size="sm"
                          className="px-4 py-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Spreadsheet
                        </Button>
                        <Button 
                          onClick={handleOpenInNewTab} 
                          variant="outline"
                          size="sm"
                          className="px-4 py-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        {file.name} • {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : file.type.includes('presentationml') || file.type === 'application/vnd.ms-powerpoint' || file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx') ? (
                <div className="w-full h-full flex flex-col">
                  <div className="bg-red-50 dark:bg-red-800 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        PowerPoint Presentation
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                      <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 mb-6 mx-auto w-fit">
                        <FileText className="h-16 w-16 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        PowerPoint Presentation
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        This PowerPoint presentation is ready to view. Click below to download or open it in a new tab for the best viewing experience.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button 
                          onClick={handleDownload} 
                          size="sm"
                          className="px-4 py-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Presentation
                        </Button>
                        <Button 
                          onClick={handleOpenInNewTab} 
                          variant="outline"
                          size="sm"
                          className="px-4 py-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        {file.name} • {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-6 mb-6">
                {getFileIcon(file.type)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {getFileTypeLabel(file.type)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                This file type cannot be previewed in the browser. You can download it or open it in a new tab.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="px-6"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button
                  onClick={handleOpenInNewTab}
                  className="px-6"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}