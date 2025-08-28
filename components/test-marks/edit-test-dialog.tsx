"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TestMark {
  id: string
  testName: string
  subjectId: string
  subjectName: string
  date: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  comments?: string
  testType: "Quiz" | "Midterm" | "Final" | "Assignment" | "Project"
  createdAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface EditTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  test: TestMark
  subjects: Subject[]
  onEditTest: (test: TestMark) => void
}

export function EditTestDialog({
  test,
  subjects,
  open,
  onOpenChange,
  onEditTest,
}: EditTestDialogProps) {
  const [formData, setFormData] = useState({
    testName: "",
    subjectId: "",
    date: "",
    marksObtained: "",
    totalMarks: "",
    comments: "",
    testType: "" as TestMark["testType"],
  })

  useEffect(() => {
    if (test) {
      setFormData({
        testName: test.testName,
        subjectId: test.subjectId,
        date: test.date,
        marksObtained: test.marksObtained.toString(),
        totalMarks: test.totalMarks.toString(),
        comments: test.comments || "",
        testType: test.testType,
      })
    }
  }, [test])

  if (!test) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.testName.trim() || !formData.subjectId) return

    const selectedSubject = subjects.find((s) => s.id === formData.subjectId)
    if (!selectedSubject) return

    const updatedTest: TestMark = {
      ...test,
      testName: formData.testName.trim(),
      subjectId: formData.subjectId,
      subjectName: selectedSubject.name,
      date: formData.date,
      marksObtained: Number.parseInt(formData.marksObtained) || 0,
      totalMarks: Number.parseInt(formData.totalMarks) || 100,
      comments: formData.comments.trim() || undefined,
      testType: formData.testType,
    }

    onEditTest(updatedTest)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Test Result</DialogTitle>
          <DialogDescription>Update the test information and score</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder="e.g., Calculus Quiz 1, Midterm Exam"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select
                value={formData.testType}
                onValueChange={(value) => setFormData({ ...formData, testType: value as TestMark["testType"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Midterm">Midterm</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Test Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marksObtained">Marks Obtained</Label>
              <Input
                id="marksObtained"
                type="number"
                min="0"
                placeholder="e.g., 85"
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Add notes about your performance, areas to improve, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
