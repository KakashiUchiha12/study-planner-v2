"use client"

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'

interface QuillWrapperProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  showPreview?: boolean
}

export function QuillWrapper({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?", 
  className,
  minHeight = 120,
  showPreview = false
}: QuillWrapperProps) {
  const [isQuillReady, setIsQuillReady] = useState(false)
  const [QuillComponent, setQuillComponent] = useState<any>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const quillRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Use enhanced textarea with instant loading
    setIsQuillReady(false)
  }, [])

  useEffect(() => {
    if (isQuillReady && quillRef.current && value !== quillRef.current.value) {
      quillRef.current.value = value
    }
  }, [value, isQuillReady])

  const handleQuillChange = (content: string) => {
    onChange(content)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  // Enhanced textarea fallback with basic formatting support
  if (!isQuillReady || !QuillComponent) {
    return (
      <div className={cn("relative", className)}>
        <div className="border border-input rounded-md bg-background">
          {/* Enhanced toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-input bg-muted/30 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 2, end + 2)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors font-bold"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 1, end + 1)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors italic"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `~~${selectedText}~~` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 2, end + 2)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors line-through"
              title="Strikethrough"
            >
              <span className="line-through">S</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + selectedText.length + 3, start + selectedText.length + 6)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Link"
            >
              🔗
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `# ${selectedText}` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 2, end + 2)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Heading"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `## ${selectedText}` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 3, end + 3)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Subheading"
            >
              H2
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `- ${selectedText}` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 2, end + 2)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `1. ${selectedText}` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 3, end + 3)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Numbered List"
            >
              1.
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `> ${selectedText}` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 2, end + 2)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors"
              title="Quote"
            >
              "
            </button>
            <button
              type="button"
              onClick={() => {
                const textarea = containerRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const selectedText = value.substring(start, end)
                  const newText = value.substring(0, start) + `\`${selectedText}\`` + value.substring(end)
                  onChange(newText)
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start + 1, end + 1)
                  }, 0)
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-background transition-colors font-mono"
              title="Code"
            >
              &lt;/&gt;
            </button>
          </div>
          {!isPreviewMode && (
            <textarea
              ref={containerRef}
              value={value}
              onChange={handleTextareaChange}
              placeholder={placeholder}
              className={cn(
                "w-full resize-none px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 border-0 bg-transparent"
              )}
              style={{ minHeight: `${minHeight - 40}px` }}
            />
          )}
          {isPreviewMode && (
            <div 
              className="px-3 py-2 text-sm"
              style={{ minHeight: `${minHeight - 40}px` }}
            >
              {value ? (
                <MarkdownRenderer content={value} className="text-sm" />
              ) : (
                <div className="text-muted-foreground italic">No content to preview</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Markdown supported
          </div>
          {showPreview && value && (
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-xs text-blue-600 hover:underline"
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
          )}
        </div>
        
        {showPreview && value && isPreviewMode && (
          <div className="mt-3 p-3 border border-input rounded-md bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
            <MarkdownRenderer content={value} className="text-sm" />
          </div>
        )}
      </div>
    )
  }

  // Quill configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link'
  ]

  return (
    <div className={cn("relative", className)}>
      <QuillComponent
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleQuillChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
        className="quill-editor"
      />
      <style jsx global>{`
        .quill-editor .ql-editor {
          min-height: ${minHeight}px;
          font-size: 14px;
          line-height: 1.5;
        }
        .quill-editor .ql-toolbar {
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
        }
        .quill-editor .ql-container {
          border-bottom: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 6px 6px;
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
