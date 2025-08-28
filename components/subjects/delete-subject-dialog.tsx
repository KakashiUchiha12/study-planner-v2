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
}

interface DeleteSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  onDeleteSubject: (subjectId: string) => void
}

export function DeleteSubjectDialog({ open, onOpenChange, subject, onDeleteSubject }: DeleteSubjectDialogProps) {
  const handleDelete = () => {
    onDeleteSubject(subject.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Subject</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{subject.name}"? This action cannot be undone and will remove all
            associated data including syllabus progress, test marks, and study sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-destructive/10 p-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${subject.color}`} />
            <span className="font-medium">{subject.name}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {subject.description || 'No description provided'}
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Progress: {subject.completedChapters || 0}/{subject.totalChapters || 0} chapters ({subject.progress || 0}%)
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
