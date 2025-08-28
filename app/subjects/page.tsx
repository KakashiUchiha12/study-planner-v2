"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Plus, Edit, Trash2, Eye, ArrowLeft, GripVertical } from "lucide-react"
import { AddSubjectDialog } from "@/components/subjects/add-subject-dialog"
import { EditSubjectDialog } from "@/components/subjects/edit-subject-dialog"
import { DeleteSubjectDialog } from "@/components/subjects/delete-subject-dialog"
import { SubjectDetailDialog } from "@/components/subjects/subject-detail-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useSubjects, useMigration } from "@/hooks"
import { Subject } from "@prisma/client"
import { notifyDataUpdate } from "@/lib/data-sync"
import { getColorHex } from "@/lib/utils/colors"
import { FileUploadSimple } from '@/components/subjects/file-upload-simple'

export default function SubjectsPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
    detail: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  })
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const router = useRouter()

  // Use database hooks
  const { 
    subjects, 
    loading: subjectsLoading, 
    error: subjectsError,
    createSubject, 
    updateSubject, 
    deleteSubject,
    refreshSubjects 
  } = useSubjects()
  
  const { autoMigrateIfNeeded } = useMigration()

  useEffect(() => {
    // Check authentication using NextAuth
    if (status === "loading") return // Wait for session to load
    
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Auto-migrate data if needed
    if (status === "authenticated") {
      autoMigrateIfNeeded()
    }
  }, [router, status, autoMigrateIfNeeded])

  // Listen for subject updates from other components
  useEffect(() => {
    const handleSubjectUpdate = () => {
      refreshSubjects()
    }

    window.addEventListener('subject-updated', handleSubjectUpdate)
    
    return () => {
      window.removeEventListener('subject-updated', handleSubjectUpdate)
    }
  }, [refreshSubjects])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show loading state while loading subjects (only after authentication is confirmed)
  if (status === "authenticated" && subjectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view subjects</h1>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )



  const handleAddSubject = async (newSubject: Omit<Subject, "id">) => {
    try {
      await createSubject({
        name: newSubject.name,
        color: newSubject.color,
        description: newSubject.description || '',
        code: newSubject.code || '',
        credits: newSubject.credits || 3,
        instructor: newSubject.instructor || '',
        totalChapters: newSubject.totalChapters || 0,
        completedChapters: newSubject.completedChapters || 0,
        progress: newSubject.progress || 0,
        nextExam: newSubject.nextExam || undefined,
        assignmentsDue: newSubject.assignmentsDue || 0
      })
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      setDialogState({ ...dialogState, add: false })
    } catch (error) {
      console.error('Failed to create subject:', error)
      // Error handling is managed by the hook
    }
  }

  const handleEditSubject = async (updatedSubject: Subject) => {
    try {
      await updateSubject(updatedSubject.id, {
        name: updatedSubject.name,
        color: updatedSubject.color,
        description: updatedSubject.description || '',
        code: updatedSubject.code || '',
        credits: updatedSubject.credits || 3,
        instructor: updatedSubject.instructor || '',
        totalChapters: updatedSubject.totalChapters || 0,
        completedChapters: updatedSubject.completedChapters || 0,
        progress: updatedSubject.progress || 0,
        nextExam: updatedSubject.nextExam || undefined,
        assignmentsDue: updatedSubject.assignmentsDue || 0
      })
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      setDialogState({ ...dialogState, edit: false })
      setSelectedSubject(null)
    } catch (error) {
      console.error('Failed to update subject:', error)
      // Error handling is managed by the hook
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId)
      
      // Notify other pages to refresh their data
      notifyDataUpdate.subject()
      
      setDialogState({ ...dialogState, delete: false })
      setSelectedSubject(null)
    } catch (error) {
      console.error('Failed to delete subject:', error)
      // Error handling is managed by the hook
    }
  }

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    console.log('Drag started for subject:', subjectId)
    setDraggedSubject(subjectId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    console.log('Drop event triggered at index:', dropIndex)
    console.log('Dragged subject:', draggedSubject)
    
    if (!draggedSubject) return

    const draggedIndex = filteredSubjects.findIndex((subject) => subject.id === draggedSubject)
    console.log('Dragged index:', draggedIndex, 'Drop index:', dropIndex)
    
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      console.log('Invalid drop - same position or subject not found')
      setDraggedSubject(null)
      setDragOverIndex(null)
      return
    }

    try {
      console.log('Starting reorder process...')
      // Create a new array with the reordered subjects
      const reorderedSubjects = [...filteredSubjects]
      const [draggedSubjectData] = reorderedSubjects.splice(draggedIndex, 1)
      reorderedSubjects.splice(dropIndex, 0, draggedSubjectData)

      console.log('Reordered subjects:', reorderedSubjects.map(s => ({ name: s.name, order: s.order })))

      // Update the order field for all subjects
      const updatePromises = reorderedSubjects.map((subject, index) => {
        console.log(`Updating ${subject.name} to order ${index}`)
        return updateSubject(subject.id, { order: index })
      })

      console.log('Waiting for all updates to complete...')
      await Promise.all(updatePromises)
      console.log('All updates completed successfully')
      
      // Refresh subjects to show the new order
      refreshSubjects()
    } catch (error) {
      console.error('Failed to reorder subjects:', error)
    }

    setDraggedSubject(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedSubject(null)
    setDragOverIndex(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Error Display */}
      {subjectsError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{subjectsError}</p>
          </div>
        </div>
      )}

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
                <span className="text-xl font-bold text-foreground">Subjects</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Stats */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
            <p className="mt-2 text-muted-foreground">Manage your subjects and track your academic progress</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {subjects.length} subjects
            </Badge>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? "No subjects found" : "Ready to Organize Your Studies?"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Create subjects to organize your study sessions, track progress, and get detailed analytics. Start with subjects like 'Mathematics', 'Physics', or 'Literature'."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Subject
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject, index) => (
              <Card
                key={subject.id}
                className={`hover:shadow-md transition-all ${
                  draggedSubject === subject.id ? "opacity-50 scale-95" : ""
                } ${dragOverIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, subject.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground transition-opacity" />
                      </div>
                      <div 
                        className="h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: getColorHex(subject.color) }}
                        title={subject.color}
                      />
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, detail: true })
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject)
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
                          setDialogState({ ...dialogState, delete: true })
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {subject.code || "No code provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Description */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Description</span>
                      <span className="font-medium">
                        {subject.description || 'No description'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(subject.progress || 0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${subject.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{subject.completedChapters || 0} of {subject.totalChapters || 0} chapters</span>
                      </div>
                    </div>

                    {/* Subject Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Credits:</span>
                        <span className="ml-2 font-medium">{subject.credits || 3}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="ml-2 font-medium">{subject.instructor || 'Not assigned'}</span>
                      </div>
                      {subject.nextExam && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Next Exam:</span>
                          <span className="ml-2 font-medium">
                            {new Date(subject.nextExam).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Assignments Due:</span>
                        <span className="ml-2 font-medium">{subject.assignmentsDue || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddSubjectDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        onAddSubject={handleAddSubject as any}
      />

      {selectedSubject && (
        <>
          <EditSubjectDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
            subject={selectedSubject as any}
            onEditSubject={handleEditSubject as any}
          />

          <DeleteSubjectDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
            subject={selectedSubject as any}
            onDeleteSubject={handleDeleteSubject}
          />

          <SubjectDetailDialog
            open={dialogState.detail}
            onOpenChange={(open) => setDialogState({ ...dialogState, detail: open })}
            subject={selectedSubject as any}
          />
        </>
      )}
    </div>
  )
}
