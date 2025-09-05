"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Edit3, Trash2, Plus, Target, Calendar, CheckSquare } from "lucide-react"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { GoalCard, GoalTask } from './goals-tab'

interface SortableGoalCardProps {
  goal: GoalCard
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

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
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
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 w-full group">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="p-1.5 bg-slate-100 rounded hover:bg-slate-200">
            <GripVertical className="h-3 w-3 text-slate-500" />
          </div>
        </div>

        <div className="pt-8">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{goal.title}</h3>
              <p className="text-slate-600 text-sm mb-3">{goal.description}</p>
              
              {/* Progress Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">
                    {goal.tasks.length > 0 
                      ? Math.round((goal.tasks.filter(t => t.completed).length / goal.tasks.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${goal.tasks.length > 0 
                        ? (goal.tasks.filter(t => t.completed).length / goal.tasks.length) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {goal.category}
                </span>
                {goal.targetDate && (
                  <span className="px-2 py-1 rounded text-xs border border-slate-300 text-slate-600">
                    Due: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                Tasks ({goal.tasks.filter(t => t.completed).length}/{goal.tasks.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddTask}
                className="h-7 text-xs px-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
            
            {goal.tasks.length > 0 ? (
              <div className="space-y-2">
                {goal.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(task.id)}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="px-2 py-1 rounded text-xs border border-slate-300 text-slate-600">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
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
              <div className="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300">
                <CheckSquare className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No tasks yet. Add your first task!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
