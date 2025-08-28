"use client"

import type React from "react"

import { useState } from "react"
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

interface SyllabusItem {
  title: string
  description: string
  completed: boolean
  estimatedHours: number
}

interface Subject {
  id: string
  name: string
  color: string
}

interface AddSyllabusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  onAddSyllabus: (subjectId: string, item: SyllabusItem) => void
}

export function AddSyllabusDialog({ open, onOpenChange, subject, onAddSyllabus }: AddSyllabusDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimatedHours: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    const syllabusItem: SyllabusItem = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      completed: false,
      estimatedHours: Number.parseInt(formData.estimatedHours) || 1,
    }

    onAddSyllabus(subject.id, syllabusItem)

    // Reset form
    setFormData({
      title: "",
      description: "",
      estimatedHours: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Syllabus Topic</DialogTitle>
          <DialogDescription>
            Add a new topic or chapter to <span className="font-medium">{subject.name}</span>
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

          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Study Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="1"
              placeholder="e.g., 8"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Topic</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
