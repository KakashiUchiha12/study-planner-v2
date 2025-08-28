"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Eye, 
  X,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react"

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`

interface FilePreviewProps {
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
    isPublic?: boolean
    content?: string
  }
  isOpen: boolean
  onClose: () => void
  showDownload?: boolean
  showDelete?: boolean
  onDelete?: (fileId: string) => void
}

export function FilePreview({ 
  file, 
  isOpen, 
  onClose, 
  showDownload = true, 
  showDelete = false,
  onDelete 
}: FilePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [textContent, setTextContent] = useState<string>('')
  const [isLoadingText, setIsLoadingText] = useState(false)

  // Load text file content when component mounts
  useEffect(() => {
    if (file.type.startsWith('text/') && file.url && !file.content) {
      setIsLoadingText(true)
      fetch(file.url)
        .then(response => response.text())
        .then(content => {
          setTextContent(content)
          setIsLoadingText(false)
        })
        .catch(error => {
          console.error('Error loading text file:', error)
          setTextContent('Error loading file content')
          setIsLoadingText(false)
        })
    } else if (file.content) {
      setTextContent(file.content)
    }
  }, [file.url, file.type, file.content])

  const getFileIcon = (fileType: string) => {
    if (!fileType) return '📁'
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('text/')) return '📝'
    if (fileType.includes('word') || fileType.includes('document')) return '📄'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.startsWith('video/')) return '🎬'
    return '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatFileType = (fileType: string) => {
    if (!fileType) return 'Unknown File'
    if (fileType.startsWith('image/')) return 'Image'
    if (fileType === 'application/pdf') return 'PDF Document'
    if (fileType.startsWith('text/')) return 'Text File'
    if (fileType.includes('word')) return 'Word Document'
    if (fileType.includes('excel')) return 'Excel Spreadsheet'
    if (fileType.includes('powerpoint')) return 'PowerPoint Presentation'
    if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive'
    if (fileType.startsWith('audio/')) return 'Audio File'
    if (fileType.startsWith('video/')) return 'Video File'
    return 'File'
  }

  const handleAudioPlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoPlayPause = () => {
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleAudioLoad = (element: HTMLAudioElement) => {
    setAudio(element)
    element.addEventListener('ended', () => setIsPlaying(false))
  }

  const handleVideoLoad = (element: HTMLVideoElement) => {
    setVideo(element)
    element.addEventListener('ended', () => setIsPlaying(false))
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id)
      onClose()
    }
  }

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Image Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Image Preview</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Image Content */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
            <img 
              src={file.url} 
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
                e.currentTarget.alt = 'Image preview not available'
              }}
            />
          </div>
        </div>
      )
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="w-full h-[60vh] border rounded-lg overflow-hidden bg-muted/20">
          <div className="h-full flex flex-col">
            {/* PDF Preview Header */}
            <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium">PDF Preview</span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            
            {/* PDF Content */}
            <div className="flex-1 relative">
              <PDFViewer url={file.url} />
            </div>
          </div>
        </div>
      )
    }

    if (file.type.includes('word') || file.type.includes('document') || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Word Document Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Word Document</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Word Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📄</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for Word documents. You can download the file to view it in Microsoft Word or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.includes('excel') || file.type.includes('spreadsheet') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Excel Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Excel Spreadsheet</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Excel Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📊</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for Excel files. You can download the file to view it in Microsoft Excel or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Spreadsheet
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.includes('powerpoint') || file.type.includes('presentation') ||
        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* PowerPoint Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">PowerPoint Presentation</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* PowerPoint Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📊</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for PowerPoint files. You can download the file to view it in Microsoft PowerPoint or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Presentation
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('audio/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Audio Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Audio Preview</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Audio Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">🎵</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <audio
              ref={handleAudioLoad}
              controls
              className="w-full max-w-md"
            >
              <source src={file.url} type={file.type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('video/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Video Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Video Preview</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Video Content */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
            <video
              ref={handleVideoLoad}
              controls
              className="w-full max-w-2xl h-full object-contain rounded shadow-lg"
              poster={file.thumbnail}
            >
              <source src={file.url} type={file.type} />
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('text/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Text Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Text File Preview</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="flex-1 bg-muted/20 p-4">
            <div className="bg-background rounded-lg border h-full overflow-auto">
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading text content...</p>
                  </div>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-words p-4 h-full overflow-auto">
                  {textContent || 'Text content not available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Archive Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Archive File</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Archive Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📦</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for archive files. You can download the file and extract it using applications like WinRAR, 7-Zip, or built-in archive tools.
            </p>
            <Button onClick={handleDownload} size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Archive
            </Button>
          </div>
        </div>
      )
    }

    // Default for other file types
    return (
      <div className="w-full h-[60vh] flex flex-col">
        {/* Default File Header */}
        <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">File Preview</span>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(file.url, '_blank')}
            >
              <Eye className="h-3 w-3 mr-1" />
              Open in New Tab
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Default File Content */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
          <div className="text-6xl mb-6">{getFileIcon(file.type)}</div>
          <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Preview not available for this file type. You can download the file to view it in an appropriate application.
          </p>
          <Button onClick={handleDownload} size="lg">
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <span className="truncate max-w-md">{file.name || 'Unnamed File'}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
            <div>
              <span className="font-medium">Type:</span>
              <p className="text-muted-foreground">{formatFileType(file.type)}</p>
            </div>
            <div>
              <span className="font-medium">Size:</span>
              <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            {file.uploadedAt && (
              <div>
                <span className="font-medium">Uploaded:</span>
                <p className="text-muted-foreground">
                  {file.uploadedAt instanceof Date ? file.uploadedAt.toLocaleDateString() : 'Invalid date'}
                </p>
              </div>
            )}
            {file.category && (
              <div>
                <span className="font-medium">Category:</span>
                <p className="text-muted-foreground">{file.category}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {file.description && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <span className="font-medium text-sm">Description:</span>
              <p className="text-muted-foreground text-sm mt-1">{file.description}</p>
            </div>
          )}
          
          {/* File Preview */}
          <div className="border rounded-lg p-4 bg-background">
            {renderPreview()}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {showDelete && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <X className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            {showDownload && (
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// PDF Viewer Component using PDF.js
function PDFViewer({ url }: { url: string }) {
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadPDF()
  }, [url])

  const loadPDF = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      
      setPdfDocument(pdf)
      setTotalPages(pdf.numPages)
      setIsLoading(false)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage()
    }
  }, [pdfDocument, currentPage])

  const renderPage = async () => {
    if (!pdfDocument || !canvasRef.current) return

    try {
      const page = await pdfDocument.getPage(currentPage)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        // Calculate scale to fit canvas
        const viewport = page.getViewport({ scale: 1 })
        const canvasWidth = canvas.clientWidth
        const canvasHeight = canvas.clientHeight
        
        const scale = Math.min(canvasWidth / viewport.width, canvasHeight / viewport.height)
        const scaledViewport = page.getViewport({ scale })

        // Set canvas dimensions
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas
        }

        await page.render(renderContext).promise
      }
    } catch (err) {
      console.error('Error rendering page:', err)
      setError('Failed to render page')
    }
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">PDF Preview not available</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={() => window.open(url, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Navigation */}
      <div className="bg-muted/30 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border rounded shadow-lg"
        />
      </div>
    </div>
  )
}
