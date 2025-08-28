"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StudyGoal {
  id: string
  type: "daily" | "weekly" | "monthly"
  target: number
  current: number
  period: string
}

interface StudyGoalsCardProps {
  goals: StudyGoal[]
  onUpdateGoals: (goals: StudyGoal[]) => void
}

export function StudyGoalsCard({ goals, onUpdateGoals }: StudyGoalsCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null)
  const [newTarget, setNewTarget] = useState("")

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getGoalStatus = (goal: StudyGoal) => {
    const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100))
    if (percentage >= 100) return { color: "text-accent", status: "Completed!" }
    if (percentage >= 75) return { color: "text-primary", status: "Almost there" }
    if (percentage >= 50) return { color: "text-chart-1", status: "Good progress" }
    return { color: "text-muted-foreground", status: "Keep going" }
  }

  const handleEditGoal = (goal: StudyGoal) => {
    setEditingGoal(goal)
    setNewTarget((goal.target / 60).toString()) // Convert to hours for display
    setEditDialogOpen(true)
  }

  const handleSaveGoal = () => {
    if (!editingGoal) return

    const targetMinutes = Math.round(Number.parseFloat(newTarget) * 60)
    if (targetMinutes <= 0) return

    const updatedGoals = goals.map((goal) => (goal.id === editingGoal.id ? { ...goal, target: targetMinutes } : goal))

    onUpdateGoals(updatedGoals)
    localStorage.setItem("studyGoals", JSON.stringify(updatedGoals))
    setEditDialogOpen(false)
    setEditingGoal(null)
    setNewTarget("")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Study Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100))
              const status = getGoalStatus(goal)

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium capitalize">{goal.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(goal.current)} / {formatDuration(goal.target)}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={status.color}>{status.status}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit {editingGoal?.type} Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target">Target Hours per {editingGoal?.type}</Label>
              <Input
                id="target"
                type="number"
                step="0.5"
                min="0.5"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Enter target hours"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGoal}>Save Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
