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

interface StudySession {
  id: string
  subjectName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  sessionType: string
}

interface DeleteSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: StudySession
  onDeleteSession: (sessionId: string) => void
}

export function DeleteSessionDialog({ open, onOpenChange, session, onDeleteSession }: DeleteSessionDialogProps) {
  const handleDelete = () => {
    onDeleteSession(session.id)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Study Session</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this study session? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-destructive/10 p-4">
          <div className="font-medium">{session.subjectName}</div>
          <div className="text-sm text-muted-foreground mt-1">{session.sessionType}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(session.date).toLocaleDateString()} • {session.startTime} - {session.endTime}
          </div>
          <div className="text-sm font-medium mt-2">Duration: {formatDuration(session.duration)}</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
