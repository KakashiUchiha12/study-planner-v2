"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, BookOpen, FileText, Clock, CheckSquare, Target, File } from "lucide-react"

interface SearchResult {
  id: string
  type: "subject" | "test" | "session" | "syllabus" | "task" | "file"
  title: string
  description: string
  metadata: string
  relevance: number
}

interface GlobalSearchProps {
  trigger?: React.ReactNode
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results: SearchResult[] = []

    try {
      // Search Subjects
      const subjects = JSON.parse(localStorage.getItem("subjects") || "[]")
      subjects.forEach((subject: any) => {
        const materialsMatch = (subject.materials || []).some((material: any) => {
          if (typeof material === "string") {
            return material.toLowerCase().includes(query.toLowerCase())
          } else if (material && typeof material === "object") {
            return (material.name || "").toLowerCase().includes(query.toLowerCase())
          }
          return false
        })

        if (
          (subject.name || "").toLowerCase().includes(query.toLowerCase()) ||
          (subject.description || "").toLowerCase().includes(query.toLowerCase()) ||
          materialsMatch
        ) {
          results.push({
            id: subject.id,
            type: "subject",
            title: subject.name || "Untitled Subject",
            description: subject.description || "No description",
            metadata: `${subject.completedChapters || 0}/${subject.totalChapters || 0} chapters • ${subject.progress || 0}% complete`,
            relevance: calculateRelevance(query, [
              subject.name || "",
              subject.description || "",
              ...(subject.materials || []).map((m: any) => (typeof m === "string" ? m : m?.name || "")),
            ]),
          })
        }
      })

      // Search Test Marks
      const testMarks = JSON.parse(localStorage.getItem("testMarks") || "[]")
      testMarks.forEach((test: any) => {
        if (
          (test.testName || "").toLowerCase().includes(query.toLowerCase()) ||
          (test.subjectName || "").toLowerCase().includes(query.toLowerCase()) ||
          (test.comments || "").toLowerCase().includes(query.toLowerCase())
        ) {
          results.push({
            id: test.id,
            type: "test",
            title: test.testName || "Untitled Test",
            description: `${test.subjectName || "Unknown Subject"} • ${test.testType || "Test"}`,
            metadata: `${test.marksObtained || 0}/${test.totalMarks || 0} (${test.grade || "N/A"}) • ${new Date(test.date).toLocaleDateString()}`,
            relevance: calculateRelevance(query, [test.testName || "", test.subjectName || "", test.comments || ""]),
          })
        }
      })

      // Search Study Sessions
      const studySessions = JSON.parse(localStorage.getItem("studySessions") || "[]")
      studySessions.forEach((session: any) => {
        const topicsMatch = (session.topicsCovered || []).some(
          (topic: any) => topic && typeof topic === "string" && topic.toLowerCase().includes(query.toLowerCase()),
        )
        const materialsMatch = (session.materialsUsed || []).some(
          (material: any) =>
            material && typeof material === "string" && material.toLowerCase().includes(query.toLowerCase()),
        )

        if (
          (session.subjectName || "").toLowerCase().includes(query.toLowerCase()) ||
          topicsMatch ||
          (session.notes || "").toLowerCase().includes(query.toLowerCase()) ||
          materialsMatch
        ) {
          results.push({
            id: session.id,
            type: "session",
            title: `${session.subjectName || "Unknown Subject"} Study Session`,
            description:
              (session.topicsCovered || []).filter((t: any) => t && typeof t === "string").join(", ") ||
              "No topics specified",
            metadata: `${Math.floor((session.duration || 0) / 60)}h ${(session.duration || 0) % 60}m • ${session.sessionType || "Study"} • ${new Date(session.date).toLocaleDateString()}`,
            relevance: calculateRelevance(query, [
              session.subjectName || "",
              ...(session.topicsCovered || []).filter((t: any) => t && typeof t === "string"),
              session.notes || "",
              ...(session.materialsUsed || []).filter((m: any) => m && typeof m === "string"),
            ]),
          })
        }
      })

      // Search Syllabus Items
      subjects.forEach((subject: any) => {
        if (subject.syllabus) {
          subject.syllabus.forEach((item: any) => {
            if (
              (item.title || "").toLowerCase().includes(query.toLowerCase()) ||
              (item.description || "").toLowerCase().includes(query.toLowerCase())
            ) {
              results.push({
                id: `${subject.id}-${item.id}`,
                type: "syllabus",
                title: item.title || "Untitled Topic",
                description: `${subject.name || "Unknown Subject"} • ${item.description || "No description"}`,
                metadata: `${item.estimatedHours || 0}h estimated • ${item.completed ? "Completed" : "Pending"}`,
                relevance: calculateRelevance(query, [item.title || "", item.description || ""]),
              })
            }
          })
        }
      })

      // Search Tasks
      const tasks = JSON.parse(localStorage.getItem("tasks") || "[]")
      tasks.forEach((task: any) => {
        if (
          (task.text || "").toLowerCase().includes(query.toLowerCase()) ||
          (task.notes || "").toLowerCase().includes(query.toLowerCase())
        ) {
          results.push({
            id: task.id,
            type: "task",
            title: task.text || "Untitled Task",
            description: task.notes || "No additional notes",
            metadata: `${task.priority || "medium"} priority • ${task.completed ? "Completed" : "Pending"} • Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}`,
            relevance: calculateRelevance(query, [task.text || "", task.notes || ""]),
          })
        }
      })

      // Search Files (from subjects materials with multiple files support)
      subjects.forEach((subject: any) => {
        if (subject.materials) {
          subject.materials.forEach((material: any, materialIndex: number) => {
            // Search through multiple files per material
            if (material.files && Array.isArray(material.files)) {
              material.files.forEach((file: any, fileIndex: number) => {
                if (
                  (file.name || "").toLowerCase().includes(query.toLowerCase()) ||
                  (file.notes || "").toLowerCase().includes(query.toLowerCase()) ||
                  (material.name || "").toLowerCase().includes(query.toLowerCase()) ||
                  (file.type || "").toLowerCase().includes(query.toLowerCase())
                ) {
                  results.push({
                    id: `${subject.id}-material-${materialIndex}-file-${fileIndex}`,
                    type: "file",
                    title: file.name || "Untitled File",
                    description: `${subject.name || "Unknown Subject"} • ${material.name || "Unnamed Material"}${file.notes ? ` • ${file.notes}` : ""}`,
                    metadata: `${((file.size || 0) / 1024).toFixed(1)} KB • ${file.type || "Unknown type"} • ${file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : "Unknown date"}`,
                    relevance: calculateRelevance(query, [
                      file.name || "",
                      file.notes || "",
                      material.name || "",
                      file.type || "",
                    ]),
                  })
                }
              })
            }
            // Legacy support for single file per material
            else if (material.file) {
              if (
                (material.file.name || "").toLowerCase().includes(query.toLowerCase()) ||
                (material.name || "").toLowerCase().includes(query.toLowerCase()) ||
                (material.file.type || "").toLowerCase().includes(query.toLowerCase())
              ) {
                results.push({
                  id: `${subject.id}-legacy-file-${materialIndex}`,
                  type: "file",
                  title: material.file.name || "Untitled File",
                  description: `${subject.name || "Unknown Subject"} • ${material.name || "Unnamed Material"}`,
                  metadata: `${((material.file.size || 0) / 1024).toFixed(1)} KB • ${material.file.type || "Unknown type"}`,
                  relevance: calculateRelevance(query, [
                    material.name || "",
                    material.file.name || "",
                    material.file.type || "",
                  ]),
                })
              }
            }
          })
        }
      })

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance)
      setSearchResults(results.slice(0, 20)) // Limit to top 20 results
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }

    setIsSearching(false)
  }

  const calculateRelevance = (query: string, searchFields: string[]): number => {
    const queryLower = query.toLowerCase()
    let relevance = 0

    searchFields.forEach((field) => {
      if (!field || typeof field !== "string") return

      const fieldLower = field.toLowerCase()
      if (fieldLower === queryLower)
        relevance += 10 // Exact match
      else if (fieldLower.startsWith(queryLower))
        relevance += 5 // Starts with query
      else if (fieldLower.includes(queryLower)) relevance += 2 // Contains query
    })

    return relevance
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "subject":
        return <BookOpen className="h-4 w-4" />
      case "test":
        return <FileText className="h-4 w-4" />
      case "session":
        return <Clock className="h-4 w-4" />
      case "syllabus":
        return <Target className="h-4 w-4" />
      case "task":
        return <CheckSquare className="h-4 w-4" />
      case "file":
        return <File className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subject":
        return "bg-primary text-primary-foreground"
      case "test":
        return "bg-accent text-accent-foreground"
      case "session":
        return "bg-chart-1 text-white"
      case "syllabus":
        return "bg-chart-2 text-white"
      case "task":
        return "bg-chart-3 text-white"
      case "file":
        return "bg-chart-4 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)

    switch (result.type) {
      case "subject":
        router.push("/subjects")
        // Store the subject ID to potentially open its detail dialog
        sessionStorage.setItem("openSubjectId", result.id)
        break
      case "test":
        router.push("/test-marks")
        break
      case "session":
        router.push("/study-sessions")
        break
      case "syllabus":
        router.push("/syllabus")
        break
      case "task":
        router.push("/dashboard")
        // Scroll to tasks section after navigation
        setTimeout(() => {
          const tasksSection = document.getElementById("tasks-section")
          if (tasksSection) {
            tasksSection.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
        break
      case "file":
        // Extract subject ID from file result ID
        const subjectId = result.id.split("-")[0]
        router.push("/subjects")
        // Store both subject ID and file info to open the right material
        sessionStorage.setItem("openSubjectId", subjectId)
        sessionStorage.setItem("highlightFile", result.title)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent">
            <Search className="h-4 w-4 mr-2" />
            Search everything...
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subjects, tests, sessions, tasks, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8 text-muted-foreground">Searching...</div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No results found for "{searchQuery}"</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Card
                    key={result.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{result.title}</h4>
                            <Badge variant="secondary" className={`text-xs ${getTypeColor(result.type)}`}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{result.description}</p>
                          <p className="text-xs text-muted-foreground">{result.metadata}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search across all your data</p>
                <p className="text-xs mt-1">Subjects • Tests • Sessions • Tasks • Files</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
