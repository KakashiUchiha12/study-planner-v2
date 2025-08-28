"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'

interface Mistake {
  id: string
  question: string
  correctAnswer: string
  yourAnswer: string
  explanation?: string
  topic?: string
  difficulty: "Easy" | "Medium" | "Hard"
}

interface TestMark {
  testName: string
  subjectId: string
  subjectName: string
  date: string
  marksObtained: number
  totalMarks: number
  comments?: string
  testType: "Quiz" | "Midterm" | "Final" | "Assignment" | "Project"
  mistakes?: Mistake[]
}

interface Subject {
  id: string
  name: string
  color: string
}

interface AddTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects: Subject[]
  onAddTest: (test: TestMark) => void
}

export function AddTestDialog({ open, onOpenChange, subjects, onAddTest }: AddTestDialogProps) {
  const [formData, setFormData] = useState({
    testName: "",
    subjectId: "",
    date: "",
    marksObtained: "",
    totalMarks: "",
    comments: "",
    testType: "" as TestMark["testType"] | "",
  })

  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [newMistake, setNewMistake] = useState({
    question: "",
    correctAnswer: "",
    yourAnswer: "",
    explanation: "",
    topic: "",
    difficulty: "Medium" as Mistake["difficulty"],
  })

  const addMistake = () => {
    if (!newMistake.question.trim() || !newMistake.correctAnswer.trim() || !newMistake.yourAnswer.trim()) return

    const mistake: Mistake = {
      id: Date.now().toString(),
      question: newMistake.question.trim(),
      correctAnswer: newMistake.correctAnswer.trim(),
      yourAnswer: newMistake.yourAnswer.trim(),
      explanation: newMistake.explanation.trim() || undefined,
      topic: newMistake.topic.trim() || undefined,
      difficulty: newMistake.difficulty,
    }

    setMistakes([...mistakes, mistake])
    setNewMistake({
      question: "",
      correctAnswer: "",
      yourAnswer: "",
      explanation: "",
      topic: "",
      difficulty: "Medium",
    })
  }

  const removeMistake = (mistakeId: string) => {
    setMistakes(mistakes.filter(m => m.id !== mistakeId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.testName.trim() || !formData.subjectId || !formData.testType) return

    const selectedSubject = subjects.find((s) => s.id === formData.subjectId)
    if (!selectedSubject) return

    const testMark: TestMark = {
      testName: formData.testName.trim(),
      subjectId: formData.subjectId,
      subjectName: selectedSubject.name,
      date: formData.date,
      marksObtained: Number.parseInt(formData.marksObtained) || 0,
      totalMarks: Number.parseInt(formData.totalMarks) || 100,
      comments: formData.comments.trim() || undefined,
      testType: formData.testType as TestMark["testType"],
      mistakes: mistakes.length > 0 ? mistakes : undefined,
    }

    onAddTest(testMark)

    // Reset form
    setFormData({
      testName: "",
      subjectId: "",
      date: "",
      marksObtained: "",
      totalMarks: "",
      comments: "",
      testType: "",
    })
    setMistakes([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Test Result</DialogTitle>
          <DialogDescription>Record a new test score to track your academic progress</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder="e.g., Calculus Quiz 1, Midterm Exam"
              required
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
              rows={3}
            />
          </div>

          {/* Mistakes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Mistakes to Remember</Label>
              <span className="text-xs text-red-600 font-medium">
                {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Add New Mistake */}
            <div className="border-dashed border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  Add a Mistake
                </h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mistake-question">Question/Problem</Label>
                  <Textarea
                    id="mistake-question"
                    placeholder="What was the question or problem you got wrong?"
                    value={newMistake.question}
                    onChange={(e) => setNewMistake({ ...newMistake, question: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="your-answer">Your Answer</Label>
                    <Input
                      id="your-answer"
                      placeholder="What you answered"
                      value={newMistake.yourAnswer}
                      onChange={(e) => setNewMistake({ ...newMistake, yourAnswer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correct-answer">Correct Answer</Label>
                    <Input
                      id="correct-answer"
                      placeholder="The right answer"
                      value={newMistake.correctAnswer}
                      onChange={(e) => setNewMistake({ ...newMistake, correctAnswer: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic (Optional)</Label>
                    <Input
                      id="topic"
                      value={newMistake.topic}
                      onChange={(e) => setNewMistake({ ...newMistake, topic: e.target.value })}
                      placeholder="e.g., Derivatives, Algebra"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={newMistake.difficulty}
                      onValueChange={(value) => setNewMistake({ ...newMistake, difficulty: value as Mistake["difficulty"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    value={newMistake.explanation}
                    onChange={(e) => setNewMistake({ ...newMistake, explanation: e.target.value })}
                    placeholder="Why was this the correct answer? What concept did you miss?"
                    rows={2}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMistake}
                  disabled={!newMistake.question.trim() || !newMistake.correctAnswer.trim() || !newMistake.yourAnswer.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add This Mistake
                </Button>
              </div>
            </div>

            {/* Display Added Mistakes */}
            {mistakes.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mistakes.map((mistake, index) => (
                  <div key={mistake.id} className="bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                          {mistake.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {mistake.topic && (
                            <span className="text-xs text-red-600 font-medium bg-red-100 dark:bg-red-900/20 rounded-full px-2 py-0.5">
                              {mistake.topic}
                            </span>
                          )}
                          <span className="text-xs text-red-600 font-medium bg-red-100 dark:bg-red-900/20 rounded-full px-2 py-0.5">
                            {mistake.difficulty}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMistake(mistake.id)}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Test Result</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
