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
import { Checkbox } from "@/components/ui/checkbox"

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

interface EditSyllabusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  syllabusItem: SyllabusItem
  onEditSyllabus: (subjectId: string, item: SyllabusItem) => void
}

export function EditSyllabusDialog({
  open,
  onOpenChange,
  subject,
  syllabusItem,
  onEditSyllabus,
}: EditSyllabusDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimatedHours: "",
    actualHours: "",
    completed: false,
  })

  useEffect(() => {
    if (syllabusItem) {
      setFormData({
        title: syllabusItem.title,
        description: syllabusItem.description,
        estimatedHours: syllabusItem.estimatedHours.toString(),
        actualHours: syllabusItem.actualHours?.toString() || "",
        completed: syllabusItem.completed,
      })
    }
  }, [syllabusItem])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    const updatedItem: SyllabusItem = {
      ...syllabusItem,
      title: formData.title.trim(),
      description: formData.description.trim(),
      estimatedHours: Number.parseInt(formData.estimatedHours) || 1,
      actualHours: formData.actualHours ? Number.parseInt(formData.actualHours) : undefined,
      completed: formData.completed,
      completedAt: formData.completed && !syllabusItem.completed ? new Date().toISOString() : syllabusItem.completedAt,
    }

    onEditSyllabus(subject.id, updatedItem)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Syllabus Topic</DialogTitle>
          <DialogDescription>
            Update the topic details for <span className="font-medium">{subject.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Topic Title</Label>
            <Input
              id="title"
              placeholder="e.g., Introduction to Calculus, Newton's Laws"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this topic covers"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                placeholder="e.g., 8"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualHours">Actual Hours</Label>
              <Input
                id="actualHours"
                type="number"
                min="0"
                placeholder="e.g., 10"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={formData.completed}
              onCheckedChange={(checked) => setFormData({ ...formData, completed: checked as boolean })}
            />
            <Label htmlFor="completed">Mark as completed</Label>
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
