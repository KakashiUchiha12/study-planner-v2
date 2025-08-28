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

interface TestMark {
  id: string
  testName: string
  subjectName: string
  date: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  testType: string
}

interface DeleteTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  test: TestMark
  onDeleteTest: (testId: string) => void
}

export function DeleteTestDialog({ open, onOpenChange, test, onDeleteTest }: DeleteTestDialogProps) {
  // Don't render if no test is selected
  if (!test) {
    return null
  }

  const handleDelete = () => {
    onDeleteTest(test.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Test Result</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this test result? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-destructive/10 p-4">
          <div className="font-medium">{test.testName}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {test.subjectName} • {test.testType}
          </div>
          <div className="text-sm text-muted-foreground">Date: {new Date(test.date).toLocaleDateString()}</div>
          <div className="text-sm font-medium mt-2">
            Score: {test.marksObtained}/{test.totalMarks} ({test.percentage}% - {test.grade})
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Test Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
