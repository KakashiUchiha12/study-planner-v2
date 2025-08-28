"use client"

import { useState } from "react"
import { generateThumbnail } from "@/app/(lib)/thumbnails-working"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSimplePage() {
  const [files, setFiles] = useState<Array<{ file: File; thumbnail: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length === 0) return

    setIsGenerating(true)
    
    try {
      const fileThumbnails = await Promise.all(
        selectedFiles.map(async (file) => {
          const thumbnail = await generateThumbnail(file)
          return { file, thumbnail }
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
          <h1 className="text-4xl font-bold mb-4">Real Thumbnail Test</h1>
          <p className="text-xl text-muted-foreground">
            Test the REAL thumbnail generation system - actual file content, not generic icons!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select files to test thumbnail generation
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
              <CardTitle>Generated Thumbnails ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={`${item.file.name} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.file.type || 'Unknown type'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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
                <p className="text-sm">Choose files above to see thumbnails</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
