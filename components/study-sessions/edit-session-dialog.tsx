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
import { Badge } from "@/components/ui/badge"
import { TimePicker } from "@/components/ui/time-picker"
import { X, Plus } from "lucide-react"

interface StudySession {
  id: string
  subjectId: string
  subjectName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  topicsCovered: string[]
  materialsUsed: string[]
  notes?: string
  sessionType: "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"
  productivity: 1 | 2 | 3 | 4 | 5
  createdAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface EditSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: StudySession
  subjects: Subject[]
  onEditSession: (session: StudySession) => void
}

export function EditSessionDialog({ open, onOpenChange, session, subjects, onEditSession }: EditSessionDialogProps) {
  const [formData, setFormData] = useState({
    subjectId: "",
    date: "",
    startTime: "",
    endTime: "",
    sessionType: "" as StudySession["sessionType"],
    productivity: 3 as StudySession["productivity"],
    notes: "",
  })
  const [topicsCovered, setTopicsCovered] = useState<string[]>([])
  const [materialsUsed, setMaterialsUsed] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState("")
  const [newMaterial, setNewMaterial] = useState("")

  useEffect(() => {
    if (session) {
      setFormData({
        subjectId: session.subjectId,
        date: session.date,
        startTime: session.startTime || "",
        endTime: session.endTime || "",
        sessionType: session.sessionType || "Focused Study",
        productivity: session.productivity || 3,
        notes: session.notes || "",
      })
      setTopicsCovered(session.topicsCovered || [])
      setMaterialsUsed(session.materialsUsed || [])
    }
  }, [session])

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    return Math.max(0, Math.round(diff / (1000 * 60)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subjectId || !formData.sessionType || !formData.startTime || !formData.endTime) return

    const selectedSubject = subjects.find((s) => s.id === formData.subjectId)
    if (!selectedSubject) return

    const duration = calculateDuration(formData.startTime, formData.endTime)
    if (duration <= 0) return

    const updatedSession: StudySession = {
      ...session,
      subjectId: formData.subjectId,
      subjectName: selectedSubject.name,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration,
      topicsCovered,
      materialsUsed,
      notes: formData.notes.trim() || undefined,
      sessionType: formData.sessionType,
      productivity: formData.productivity,
    }

    onEditSession(updatedSession)
  }

  const addTopic = () => {
    if (newTopic.trim() && !topicsCovered.includes(newTopic.trim())) {
      setTopicsCovered([...topicsCovered, newTopic.trim()])
      setNewTopic("")
    }
  }

  const removeTopic = (index: number) => {
    setTopicsCovered(topicsCovered.filter((_, i) => i !== index))
  }

  const addMaterial = () => {
    if (newMaterial.trim() && !materialsUsed.includes(newMaterial.trim())) {
      setMaterialsUsed([...materialsUsed, newMaterial.trim()])
      setNewMaterial("")
    }
  }

  const removeMaterial = (index: number) => {
    setMaterialsUsed(materialsUsed.filter((_, i) => i !== index))
  }

  const duration = calculateDuration(formData.startTime, formData.endTime)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Study Session</DialogTitle>
          <DialogDescription>Update your study session details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="sessionType">Session Type</Label>
              <Select
                value={formData.sessionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, sessionType: value as StudySession["sessionType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Focused Study">Focused Study</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Practice">Practice</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Group Study">Group Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <TimePicker
                value={formData.startTime}
                onChange={(time) => setFormData({ ...formData, startTime: time })}
                placeholder="Select start time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <TimePicker
                value={formData.endTime}
                onChange={(time) => setFormData({ ...formData, endTime: time })}
                placeholder="Select end time"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "0m"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Topics Covered</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
              />
              <Button type="button" variant="outline" onClick={addTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {topicsCovered && topicsCovered.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topicsCovered.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {topic}
                    <button type="button" onClick={() => removeTopic(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Materials Used</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add material"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
              />
              <Button type="button" variant="outline" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materialsUsed && materialsUsed.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {materialsUsed.map((material, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {material}
                    <button type="button" onClick={() => removeMaterial(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productivity">Productivity Rating</Label>
            <Select
              value={(formData.productivity || 3).toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, productivity: Number.parseInt(value) as StudySession["productivity"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Low</SelectItem>
                <SelectItem value="2">2 - Low</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about your session..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={duration <= 0}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
