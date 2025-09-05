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
  description?: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date | null
  subjectId?: string | null
  estimatedTime?: number | null
  tags?: string
  progress?: number | null
  timeSpent?: number | null
  order?: number
  category?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
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
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    category: task.category || 'general',
    estimatedTime: task.estimatedTime || 0,
    tags: task.tags || '[]'
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const isCompleted = task.status === 'completed'

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !isCompleted

  const handleEdit = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      category: task.category || 'general',
      estimatedTime: task.estimatedTime || 0,
      tags: task.tags || '[]'
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    // Clear previous errors
    setEditErrors({})
    
    // Validate required fields
    const errors: Record<string, string> = {}
    
    if (!editData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (editData.estimatedTime && editData.estimatedTime < 0) {
      errors.estimatedTime = 'Estimated time cannot be negative'
    }
    
    // If there are validation errors, show them and don't save
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }
    
    try {
      await onUpdate(task.id, editData)
      setIsEditing(false)
      setEditErrors({})
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleToggleComplete = async () => {
    try {
      console.log('🔍 TaskItem: handleToggleComplete called for task:', task.id, task.title)
      console.log('🔍 TaskItem: Current task status:', task.status, 'completedAt:', task.completedAt)
      console.log('🔍 TaskItem: onToggle prop exists:', !!onToggle)
      
      // Use the onToggle prop that was passed down from TaskManager
      onToggle(task.id)
      
      console.log('🔍 TaskItem: onToggle called successfully')
    } catch (error) {
      console.error('❌ TaskItem: Failed to toggle task completion:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return 'bg-blue-100 text-blue-800'
      case 'personal':
        return 'bg-purple-100 text-purple-800'
      case 'work':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date'
    return format(new Date(date), 'MMM dd, yyyy')
  }

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'No time estimate'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getProgressPercentage = () => {
    if (task.progress === null || task.progress === undefined) return 0
    return Math.round(task.progress)
  }

  const getTimeSpent = () => {
    if (task.timeSpent === null || task.timeSpent === undefined) return 0
    return task.timeSpent
  }

  const getEstimatedTime = () => {
    if (task.estimatedTime === null || task.estimatedTime === undefined) return 0
    return task.estimatedTime
  }

  const getTags = () => {
    if (!task.tags) return []
    try {
      return JSON.parse(task.tags)
    } catch {
      return []
    }
  }

  const getSubjectName = () => {
    return task.subjectId || 'No subject'
  }

  const getSubjectColor = () => {
    return task.subjectId ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
  }

  const getSubjectIcon = () => {
    return task.subjectId ? '📚' : '📝'
  }

  const getSubjectAbbr = () => {
    if (!task.subjectId) return 'NS'
    return task.subjectId.substring(0, 2).toUpperCase()
  }

  const getSubjectFullName = () => {
    return task.subjectId || 'No Subject Assigned'
  }

  const getSubjectProgress = () => {
    if (task.progress === null || task.progress === undefined) return 0
    return task.progress
  }

  const getSubjectStatus = () => {
    if (task.status === 'completed') return 'Completed'
    if (task.status === 'in_progress') return 'In Progress'
    return 'Pending'
  }

  const getSubjectPriority = () => {
    switch (task.priority) {
      case 'high':
        return 'High Priority'
      case 'medium':
        return 'Medium Priority'
      default:
        return 'Low Priority'
    }
  }

  const getSubjectCategory = () => {
    return task.category || 'General'
  }

  const getSubjectTags = () => {
    return getTags().join(', ') || 'No tags'
  }

  const getSubjectTimeInfo = () => {
    const estimated = getEstimatedTime()
    const spent = getTimeSpent()
    
    if (estimated === 0 && spent === 0) return 'No time data'
    if (estimated === 0) return `Spent: ${formatTime(spent)}`
    if (spent === 0) return `Estimated: ${formatTime(estimated)}`
    
    return `${formatTime(spent)} / ${formatTime(estimated)}`
  }

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || 'Study',
      estimatedTime: task.estimatedTime || 0,
      status: task.status,
      dueDate: task.dueDate,
      tags: task.tags || ''
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
          ${dragOverIndex === index ? 'border-primary border-2 bg-primary/5' : 'bg-card'}
          ${isCompleted ? 'bg-muted/50' : ''}
          ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
          hover:scale-[1.01] hover:shadow-lg
        `}
        draggable={!isEditing && !isCompleted}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault()
          // Only set dropEffect if dataTransfer exists (for test environment compatibility)
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move"
          }
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
                onClick={handleToggleComplete}
                className="flex-shrink-0 transition-colors"
                aria-label={isCompleted ? "Mark task as incomplete" : "Mark task as complete"}
                title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
              >
                {isCompleted ? (
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
                      <SelectTrigger aria-label="Priority">
                        <SelectValue placeholder={editData.priority} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={editData.status}
                      onValueChange={(value: "pending" | "in_progress" | "completed") => 
                        setEditData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger aria-label="Status">
                        <SelectValue placeholder={editData.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                        <SelectItem value="completed">✅ Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={editData.category || ''}
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
                    <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    
                    <div className="flex items-center space-x-1">
                      {/* Priority Badge */}
                      <Badge variant="outline" className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getSubjectPriority()}
                      </Badge>
                      
                      {/* Action Buttons */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEdit}
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
                    <p className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-muted/30 rounded-full">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={isCompleted ? 'text-green-700 dark:text-green-300' : ''}>
                      {getSubjectStatus()}
                    </span>
                  </div>
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(task.category || 'general')}`}>
                      {getSubjectCategory()}
                    </Badge>
                    
                    {task.dueDate && (
                      <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate)}</span>
                        {isOverdue && <span className="font-medium">(Overdue)</span>}
                      </div>
                    )}
                    
                    {task.estimatedTime && task.estimatedTime > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(task.estimatedTime)}</span>
                      </div>
                    )}
                    
                    {task.progress !== null && task.progress !== undefined && task.progress > 0 && (
                      <div className="flex items-center space-x-1">
                        <Flag className="h-3 w-3" />
                        <span>{getProgressPercentage()}% complete</span>
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
