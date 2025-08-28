"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

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
  color: string
}

interface DeleteSyllabusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  syllabusItem: SyllabusItem
  onDeleteSyllabus: (subjectId: string, syllabusId: string) => void
}

export function DeleteSyllabusDialog({
  open,
  onOpenChange,
  subject,
  syllabusItem,
  onDeleteSyllabus,
}: DeleteSyllabusDialogProps) {
  const handleDelete = () => {
    onDeleteSyllabus(subject.id, syllabusItem.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Syllabus Topic</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{syllabusItem.title}" from {subject.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-destructive/10 p-4">
          <div className="font-medium">{syllabusItem.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{syllabusItem.description}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            Status: {syllabusItem.completed ? "Completed" : "In Progress"} • {syllabusItem.estimatedHours}h estimated
            {syllabusItem.actualHours && ` • ${syllabusItem.actualHours}h actual`}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
