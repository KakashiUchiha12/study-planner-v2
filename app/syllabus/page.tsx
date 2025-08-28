"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Search, Plus, ArrowLeft, CheckCircle, Circle, Edit, Trash2 } from "lucide-react"
import { AddSyllabusDialog } from "@/components/syllabus/add-syllabus-dialog"
import { EditSyllabusDialog } from "@/components/syllabus/edit-syllabus-dialog"
import { DeleteSyllabusDialog } from "@/components/syllabus/delete-syllabus-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface SyllabusItem {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt?: string
  estimatedHours: number
  actualHours?: number
}

interface Subject {
  id: string
  name: string
  description: string
  materials: string[]
  color: string
  progress: number
  totalChapters: number
  completedChapters: number
  createdAt: string
  syllabus?: SyllabusItem[]
}

export default function SyllabusPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedSyllabusItem, setSelectedSyllabusItem] = useState<SyllabusItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/auth/login")
      return
    }

    // Load subjects from localStorage
    const savedSubjects = localStorage.getItem("subjects")
    if (savedSubjects) {
      try {
        const parsedSubjects = JSON.parse(savedSubjects)
      // Initialize syllabus if not exists
      const subjectsWithSyllabus = parsedSubjects.map((subject: Subject) => ({
        ...subject,
        syllabus: subject.syllabus || getSampleSyllabus(subject.name),
      }))
      setSubjects(subjectsWithSyllabus)
      localStorage.setItem("subjects", JSON.stringify(subjectsWithSyllabus))
      } catch (error) {
        console.error('Failed to parse saved subjects:', error)
        localStorage.removeItem("subjects")
        setSubjects([])
      }
    }
  }, [router])

  const getSampleSyllabus = (subjectName: string): SyllabusItem[] => {
    const syllabusMap: { [key: string]: SyllabusItem[] } = {
      Mathematics: [
        {
          id: "1",
          title: "Introduction to Calculus",
          description: "Basic concepts of limits and derivatives",
          completed: true,
          completedAt: new Date().toISOString(),
          estimatedHours: 8,
          actualHours: 7,
        },
        {
          id: "2",
          title: "Differential Calculus",
          description: "Rules of differentiation and applications",
          completed: true,
          completedAt: new Date().toISOString(),
          estimatedHours: 12,
          actualHours: 10,
        },
        {
          id: "3",
          title: "Integral Calculus",
          description: "Integration techniques and applications",
          completed: false,
          estimatedHours: 15,
        },
        {
          id: "4",
          title: "Multivariable Calculus",
          description: "Functions of several variables",
          completed: false,
          estimatedHours: 20,
        },
      ],
      Physics: [
        {
          id: "1",
          title: "Classical Mechanics",
          description: "Newton's laws and motion",
          completed: true,
          completedAt: new Date().toISOString(),
          estimatedHours: 10,
          actualHours: 12,
        },
        {
          id: "2",
          title: "Thermodynamics",
          description: "Heat, work, and energy transfer",
          completed: false,
          estimatedHours: 14,
        },
        {
          id: "3",
          title: "Electromagnetism",
          description: "Electric and magnetic fields",
          completed: false,
          estimatedHours: 16,
        },
      ],
      Chemistry: [
        {
          id: "1",
          title: "Organic Chemistry Basics",
          description: "Carbon compounds and functional groups",
          completed: true,
          completedAt: new Date().toISOString(),
          estimatedHours: 12,
          actualHours: 11,
        },
        {
          id: "2",
          title: "Reaction Mechanisms",
          description: "How organic reactions occur",
          completed: true,
          completedAt: new Date().toISOString(),
          estimatedHours: 15,
          actualHours: 16,
        },
        {
          id: "3",
          title: "Stereochemistry",
          description: "3D structure of molecules",
          completed: false,
          estimatedHours: 10,
        },
      ],
    }
    return syllabusMap[subjectName] || []
  }

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.syllabus?.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const toggleSyllabusCompletion = (subjectId: string, syllabusId: string) => {
    const updatedSubjects = subjects.map((subject) => {
      if (subject.id === subjectId) {
        const updatedSyllabus = subject.syllabus?.map((item) => {
          if (item.id === syllabusId) {
            const isCompleting = !item.completed
            return {
              ...item,
              completed: isCompleting,
              completedAt: isCompleting ? new Date().toISOString() : undefined,
            }
          }
          return item
        })

        // Update subject progress based on syllabus completion
        const completedItems = updatedSyllabus?.filter((item) => item.completed).length || 0
        const totalItems = updatedSyllabus?.length || 1
        const progress = Math.round((completedItems / totalItems) * 100)

        return {
          ...subject,
          syllabus: updatedSyllabus,
          progress,
          completedChapters: completedItems,
          totalChapters: totalItems,
        }
      }
      return subject
    })

    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
  }

  const handleAddSyllabus = (subjectId: string, newItem: Omit<SyllabusItem, "id">) => {
    const updatedSubjects = subjects.map((subject) => {
      if (subject.id === subjectId) {
        const syllabusItem: SyllabusItem = {
          ...newItem,
          id: Date.now().toString(),
        }
        const updatedSyllabus = [...(subject.syllabus || []), syllabusItem]
        const completedItems = updatedSyllabus.filter((item) => item.completed).length
        const totalItems = updatedSyllabus.length
        const progress = Math.round((completedItems / totalItems) * 100)

        return {
          ...subject,
          syllabus: updatedSyllabus,
          progress,
          completedChapters: completedItems,
          totalChapters: totalItems,
        }
      }
      return subject
    })

    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, add: false })
    setSelectedSubject(null)
  }

  const handleEditSyllabus = (subjectId: string, updatedItem: SyllabusItem) => {
    const updatedSubjects = subjects.map((subject) => {
      if (subject.id === subjectId) {
        const updatedSyllabus = subject.syllabus?.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        const completedItems = updatedSyllabus?.filter((item) => item.completed).length || 0
        const totalItems = updatedSyllabus?.length || 1
        const progress = Math.round((completedItems / totalItems) * 100)

        return {
          ...subject,
          syllabus: updatedSyllabus,
          progress,
          completedChapters: completedItems,
          totalChapters: totalItems,
        }
      }
      return subject
    })

    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, edit: false })
    setSelectedSubject(null)
    setSelectedSyllabusItem(null)
  }

  const handleDeleteSyllabus = (subjectId: string, syllabusId: string) => {
    const updatedSubjects = subjects.map((subject) => {
      if (subject.id === subjectId) {
        const updatedSyllabus = subject.syllabus?.filter((item) => item.id !== syllabusId)
        const completedItems = updatedSyllabus?.filter((item) => item.completed).length || 0
        const totalItems = updatedSyllabus?.length || 1
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

        return {
          ...subject,
          syllabus: updatedSyllabus,
          progress,
          completedChapters: completedItems,
          totalChapters: totalItems,
        }
      }
      return subject
    })

    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, delete: false })
    setSelectedSubject(null)
    setSelectedSyllabusItem(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Syllabus Tracker</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search subjects or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Syllabus Progress</h1>
          <p className="mt-2 text-muted-foreground">Track your progress through each subject's curriculum</p>
        </div>

        {filteredSubjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No subjects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Add subjects first to track syllabus progress"}
              </p>
              <Link href="/subjects">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Subjects
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSubjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-4 w-4 rounded-full ${subject.color}`} />
                      <div>
                        <CardTitle className="text-xl">{subject.name}</CardTitle>
                        <CardDescription>{subject.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{subject.progress}%</div>
                        <div className="text-sm text-muted-foreground">
                          {subject.completedChapters}/{subject.totalChapters} completed
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, add: true })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Topic
                      </Button>
                    </div>
                  </div>
                  <Progress value={subject.progress} className="mt-4" />
                </CardHeader>
                <CardContent>
                  {subject.syllabus && subject.syllabus.length > 0 ? (
                    <div className="space-y-3">
                      {subject.syllabus.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                            item.completed ? "bg-accent/10 border-accent/20" : "bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleSyllabusCompletion(subject.id, item.id)}
                              className="flex-shrink-0"
                            >
                              {item.completed ? (
                                <CheckCircle className="h-5 w-5 text-accent" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                            <div className="flex-1">
                              <h4
                                className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {item.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.estimatedHours}h estimated
                                </Badge>
                                {item.actualHours && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.actualHours}h actual
                                  </Badge>
                                )}
                                {item.completedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    Completed {new Date(item.completedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSubject(subject)
                                setSelectedSyllabusItem(item)
                                setDialogState({ ...dialogState, edit: true })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSubject(subject)
                                setSelectedSyllabusItem(item)
                                setDialogState({ ...dialogState, delete: true })
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No syllabus items yet</p>
                      <Button
                        variant="outline"
                        className="mt-2 bg-transparent"
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, add: true })
                        }}
                      >
                        Add First Topic
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      {selectedSubject && (
        <>
          <AddSyllabusDialog
            open={dialogState.add}
            onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
            subject={selectedSubject}
            onAddSyllabus={handleAddSyllabus}
          />

          {selectedSyllabusItem && (
            <>
              <EditSyllabusDialog
                open={dialogState.edit}
                onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
                subject={selectedSubject}
                syllabusItem={selectedSyllabusItem}
                onEditSyllabus={handleEditSyllabus}
              />

              <DeleteSyllabusDialog
                open={dialogState.delete}
                onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
                subject={selectedSubject}
                syllabusItem={selectedSyllabusItem}
                onDeleteSyllabus={handleDeleteSyllabus}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
