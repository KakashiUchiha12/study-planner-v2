"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableGoalCard } from "./sortable-goal-card"

interface GoalTask {
  id: string
  title: string
  priority: string
  dueDate?: Date
  completed: boolean
}

interface Goal {
  id: string
  title: string
  description: string
  category: string
  status: string
  targetDate?: Date
  tasks: GoalTask[]
}

interface GoalsTabProps {
  goals: Goal[]
  onAddGoal: () => void
  onEditGoal: (goal: Goal) => void
  onDeleteGoal: (goalId: string) => void
  onAddTask: (goalId: string) => void
  onEditTask: (task: GoalTask) => void
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onReorderGoals: (goalIds: string[]) => void
}

export function GoalsTab({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onAddTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
  onReorderGoals
}: GoalsTabProps) {
  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Handle goals drag end
  const handleGoalsDragEnd = async (event: DragEndEvent) => {
    console.log('Goals drag end event:', event)
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = goals.findIndex((item) => item.id === active.id)
      const newIndex = goals.findIndex((item) => item.id === over?.id)
      
      console.log('Reordering goals:', { oldIndex, newIndex, activeId: active.id, overId: over?.id })
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          // Create new array with reordered goals
          const reorderedGoals = [...goals]
          const [movedGoal] = reorderedGoals.splice(oldIndex, 1)
          reorderedGoals.splice(newIndex, 0, movedGoal)
          
          // Update the UI by calling the reorderGoals method from the hook
          const goalIds = reorderedGoals.map(g => g.id)
          await onReorderGoals(goalIds)
          
          console.log('Goals reordered successfully:', goalIds)
        } catch (error) {
          console.error('Error reordering goals:', error)
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onAddGoal}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 md:h-10 text-xs md:text-sm px-3 md:px-4"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Add Goal
          </Button>
        </CardContent>
      </Card>

      {/* Goals List */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Your Goals ({goals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGoalsDragEnd}
            >
              <SortableContext
                items={goals.map(g => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <SortableGoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => onEditGoal(goal)}
                      onDelete={() => onDeleteGoal(goal.id)}
                      onAddTask={() => onAddTask(goal.id)}
                      onEditTask={onEditTask}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No goals yet</h3>
              <p className="text-slate-500 mb-4">Start by creating your first goal to track your progress</p>
              <Button 
                onClick={onAddGoal}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
