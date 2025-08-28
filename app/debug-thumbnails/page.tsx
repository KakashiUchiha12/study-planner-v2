"use client"

import { useState } from "react"
import { generateThumbnail } from "@/app/(lib)/thumbnails-working"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugThumbnailsPage() {
  const [files, setFiles] = useState<Array<{ file: File; thumbnail: string; logs: string[] }>>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length === 0) return

    setIsGenerating(true)
    
    try {
      const fileThumbnails = await Promise.all(
        selectedFiles.map(async (file) => {
          const logs: string[] = []
          
          // Override console.log to capture logs
          const originalLog = console.log
          console.log = (...args) => {
            logs.push(args.join(' '))
            originalLog(...args)
          }
          
          try {
            const thumbnail = await generateThumbnail(file)
            console.log = originalLog // Restore console.log
            return { file, thumbnail, logs }
          } catch (error) {
            console.log = originalLog // Restore console.log
            logs.push(`ERROR: ${error}`)
            return { file, thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmYwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+PC9zdmc+', logs }
          }
        })
      )
      
      setFiles(fileThumbnails)
    } catch (error) {
      console.error('Error generating thumbnails:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Debug Thumbnail Generation</h1>
          <p className="text-xl text-muted-foreground">
            See exactly what's happening during thumbnail generation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select files to debug thumbnail generation
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <Button asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {isGenerating && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Generating thumbnails...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {files.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">File Info</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Name:</strong> {item.file.name}</p>
                          <p><strong>Type:</strong> {item.file.type || 'Unknown'}</p>
                          <p><strong>Size:</strong> {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Thumbnail</h4>
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={`${item.file.name} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Generation Logs</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                        {item.logs.length > 0 ? (
                          item.logs.map((log, logIndex) => (
                            <div key={logIndex} className="text-gray-700">
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No logs captured</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {files.length === 0 && !isGenerating && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No files selected yet</p>
                <p className="text-sm">Choose files above to see debug information</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
