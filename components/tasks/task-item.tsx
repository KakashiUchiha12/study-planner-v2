"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Circle, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Calendar,
  Clock,
  Flag
} from "lucide-react"
import { format, isPast, isToday } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  dueDate?: Date
  priority: "low" | "medium" | "high"
  category: string
  estimatedTime?: number
  tags: string[]
  subject?: string
  progress?: number
  timeSpent?: number
}

interface TaskItemProps {
  task: Task
  index: number
  onToggle: (taskId: string) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnter?: (index: number) => void
  isDragging?: boolean
  dragOverIndex?: number | null
}

export function TaskItem({ 
  task, 
  index, 
  onToggle, 
  onUpdate, 
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragEnter,
  isDragging = false,
  dragOverIndex
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    category: task.category,
    estimatedTime: task.estimatedTime || 0
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
      case "medium": return "text-yellow-700 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300"
      case "low": return "text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300"
      default: return "text-gray-700 bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800 dark:text-gray-300"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔴"
      case "medium": return "🟡"
      case "low": return "🟢"
      default: return "⚪"
    }
  }

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed

  const handleSave = () => {
    // Clear previous errors
    setEditErrors({})
    
    // Validate required fields
    const newErrors: Record<string, string> = {}
    
    if (!editData.title.trim()) {
      newErrors.title = "Title is required"
    }
    
    if (editData.estimatedTime < 0) {
      newErrors.estimatedTime = "Estimated time cannot be negative"
    }
    
    // If there are errors, don't save
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors)
      return
    }

    onUpdate(task.id, {
      title: editData.title.trim(),
      description: editData.description.trim() || undefined,
      priority: editData.priority,
      category: editData.category.trim() || "General",
      estimatedTime: editData.estimatedTime || undefined
    })
    setIsEditing(false)
    setEditErrors({})
  }

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      estimatedTime: task.estimatedTime || 0
    })
    setEditErrors({})
    setIsEditing(false)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete(task.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card 
        className={`
          transition-all duration-200 cursor-grab active:cursor-grabbing
          ${isDragging ? 'opacity-60 scale-98 shadow-lg border-2 border-primary' : 'hover:shadow-md'}
          ${dragOverIndex === index ? 'border-primary border-2 bg-primary/5' : ''}
          ${task.completed ? 'bg-muted/50' : 'bg-card'}
          ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
          hover:scale-[1.01] hover:shadow-lg
        `}
        draggable={!isEditing}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = "move"
          onDragOver(e)
        }}
        onDrop={(e) => onDrop(e, index)}
        onDragEnter={() => onDragEnter?.(index)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Drag Handle */}
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded hover:bg-muted/50 transition-colors">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hover:text-primary" />
              </div>
              
              {/* Complete Toggle */}
              <button
                onClick={() => onToggle(task.id)}
                className="flex-shrink-0 transition-colors"
                aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                title={task.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0 transition-all duration-200">
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div>
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Task title"
                      className={`font-medium ${editErrors.title ? 'border-red-500' : ''}`}
                    />
                    {editErrors.title && (
                      <p className="text-sm text-red-500 mt-1">Title is required</p>
                    )}
                  </div>
                  
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description (optional)"
                    rows={2}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select
                      value={editData.priority}
                      onValueChange={(value: "low" | "medium" | "high") => 
                        setEditData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={editData.priority} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={editData.category}
                      onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Category"
                    />
                    
                    <div>
                      <Input
                        type="number"
                        value={editData.estimatedTime}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          estimatedTime: parseInt(e.target.value) || 0 
                        }))}
                        placeholder="Est. time (min)"
                        className={editErrors.estimatedTime ? 'border-red-500' : ''}
                      />
                      {editErrors.estimatedTime && (
                        <p className="text-sm text-red-500 mt-1">{editErrors.estimatedTime}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    
                    <div className="flex items-center space-x-1">
                      {/* Priority Badge */}
                      <Badge variant="outline" className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </Badge>
                      
                      {/* Action Buttons */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditData({
                            title: task.title,
                            description: task.description || "",
                            priority: task.priority,
                            category: task.category,
                            estimatedTime: task.estimatedTime || 0
                          })
                          setEditErrors({})
                          setIsEditing(true)
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 transition-colors"
                        aria-label="Edit task"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        aria-label="Delete task"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-muted/30 rounded-full">
                    {task.completed ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={task.completed ? 'text-green-700 dark:text-green-300' : ''}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                    {task.category && (
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    )}
                    
                    {task.dueDate && (
                      <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
                        {isOverdue && <span className="font-medium">(Overdue)</span>}
                      </div>
                    )}
                    
                    {task.estimatedTime && task.estimatedTime > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedTime}min</span>
                      </div>
                    )}
                    
                    {task.progress !== undefined && task.progress > 0 && (
                      <div className="flex items-center space-x-1">
                        <Flag className="h-3 w-3" />
                        <span>{task.progress}% complete</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">"{task.title}"</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
