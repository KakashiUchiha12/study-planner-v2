"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Edit3, Trash2, Plus, Target, Calendar } from "lucide-react"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface SortableGoalCardProps {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
  onAddTask: () => void
  onEditTask: (task: GoalTask) => void
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export function SortableGoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onAddTask, 
  onEditTask, 
  onToggleTask, 
  onDeleteTask 
}: SortableGoalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Helper functions for goal display
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'personal': return 'bg-green-100 text-green-800'
      case 'career': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateProgress = (): number => {
    if (goal.tasks.length === 0) return 0
    const completedTasks = goal.tasks.filter(task => task.completed).length
    return Math.round((completedTasks / goal.tasks.length) * 100)
  }

  const progress = calculateProgress()

  return (
    <div ref={setNodeRef} style={style} className="relative w-full">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow w-full">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
        </div>

        <CardHeader className="pt-8 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-slate-800 mb-2">{goal.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={getCategoryColor(goal.category)}>
                  {goal.category}
                </Badge>
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status}
                </Badge>
                {goal.targetDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(goal.targetDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600">{goal.description}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 hover:bg-slate-100"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium text-slate-800">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tasks ({goal.tasks.filter(t => t.completed).length}/{goal.tasks.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddTask}
                className="h-7 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
            
            {goal.tasks.length > 0 ? (
              <div className="space-y-2">
                {goal.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-md border ${
                      task.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(task.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.priority === 'high' ? 'border-red-300 text-red-700' :
                          task.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                          'border-green-300 text-green-700'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-slate-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTask(task)}
                        className="h-6 w-6 p-0 hover:bg-slate-200"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask(task.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">No tasks yet. Add your first task!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
