"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Search, Calendar, Clock, CheckCircle, Circle, AlertCircle, Filter, SortAsc, Flag } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { isPast, isToday } from "date-fns"
import { TaskItem } from "./task-item"

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

interface TaskManagerProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
  onOpenCreateDialog?: () => void
}

export function TaskManager({ tasks, onTasksChange, onOpenCreateDialog }: TaskManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // all, pending, completed, overdue
  const [sortBy, setSortBy] = useState("dueDate") // dueDate, priority, createdAt, title
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus === "pending") {
      filtered = filtered.filter(task => !task.completed)
    } else if (filterStatus === "completed") {
      filtered = filtered.filter(task => task.completed)
    } else if (filterStatus === "overdue") {
      filtered = filtered.filter(task => 
        !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        
        case "title":
          return a.title.localeCompare(b.title)
        
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, searchQuery, filterStatus, sortBy])

  const handleToggleTask = useMemo(() => {
    return (taskId: string) => {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
      onTasksChange(updatedTasks)
    }
  }, [tasks, onTasksChange])

  const handleUpdateTask = useMemo(() => {
    return (taskId: string, updates: Partial<Task>) => {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
      onTasksChange(updatedTasks)
    }
  }, [tasks, onTasksChange])

  const handleDeleteTask = useMemo(() => {
    return (taskId: string) => {
      const updatedTasks = tasks.filter(task => task.id !== taskId)
      onTasksChange(updatedTasks)
    }
  }, [tasks, onTasksChange])

  // Drag and drop handlers - works on original tasks array only
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Allow drag and drop in all cases
    console.log('🔍 Drag started for task at index:', index, 'Task:', tasks[index]?.title)
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragEnd = () => {
    console.log('🔍 Drag ended, draggedIndex was:', draggedIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    console.log('🔍 Drop event at index:', dropIndex, 'draggedIndex:', draggedIndex)
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      console.log('🔍 Drop ignored - invalid indices')
      return
    }

    // Use a standard array reordering algorithm
    const result = Array.from(tasks)
    const [removed] = result.splice(draggedIndex, 1)
    result.splice(dropIndex, 0, removed)
    
    console.log('🔍 Tasks reordered:', {
      originalOrder: tasks.map(t => ({ id: t.id, title: t.title })),
      newOrder: result.map(t => ({ id: t.id, title: t.title })),
      draggedTask: removed.title,
      dropIndex: dropIndex
    })
    
    console.log('🔍 Calling onTasksChange with reordered tasks')
    onTasksChange(result)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnter = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilterStatus("all")
    setSortBy("dueDate")
  }

  const displayedTasks = filteredAndSortedTasks

  // Task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header with Stats - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Tasks</h2>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Circle className="h-4 w-4" />
              <span>{taskStats.pending} pending</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{taskStats.completed} completed</span>
            </span>
            {taskStats.overdue > 0 && (
              <span className="flex items-center space-x-1 text-red-600">
                <Clock className="h-4 w-4" />
                <span>{taskStats.overdue} overdue</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          
          <Button onClick={onOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Search and Filters - Mobile Optimized */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 sm:h-11"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32" aria-label="Filter tasks by status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-28" aria-label="Sort tasks by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchQuery || filterStatus !== "all" || sortBy !== "dueDate") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Task List - Mobile Optimized */}
       <div className="space-y-2 sm:space-y-3 min-h-0">
         {displayedTasks.length > 0 && (
          <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground">
              {(searchQuery || filterStatus !== "all" || sortBy !== "dueDate") ? (
                "🔒 Clear filters to enable drag and drop reordering"
              ) : (
                "💡 Drag and drop tasks to reorder them (drag the grip handle)"
              )}
            </p>
            {draggedIndex !== null && (
              <p className="text-xs text-primary font-medium mt-1">
                🎯 Dragging: {tasks[draggedIndex]?.title}
              </p>
            )}
          </div>
        )}
        {displayedTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="text-muted-foreground">
                {searchQuery || filterStatus !== "all" ? (
                  <div>
                    <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No tasks found matching your criteria.</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setSearchQuery("")
                        setFilterStatus("all")
                      }}
                      className="mt-2 text-sm"
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Circle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No tasks yet. Create your first task to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
                     displayedTasks.map((task, displayIndex) => {
                       // Find the actual index in the original tasks array
                       const actualIndex = tasks.findIndex(t => t.id === task.id)
                       return (
                                                   <div
                            key={task.id}
                            data-task-index={actualIndex}
                            onDragEnter={() => handleDragEnter(actualIndex)}
                            onDragOver={handleDragOver}
                          >
                           <TaskItem
                             task={task}
                             index={actualIndex}
                             onToggle={handleToggleTask}
                             onUpdate={handleUpdateTask}
                             onDelete={handleDeleteTask}
                             onDragStart={handleDragStart}
                             onDragEnd={handleDragEnd}
                             onDragOver={handleDragOver}
                             onDrop={handleDrop}
                             onDragEnter={handleDragEnter}
                             isDragging={draggedIndex === actualIndex}
                             dragOverIndex={dragOverIndex === actualIndex ? actualIndex : null}
                           />
                         </div>
                       )
                     })
        )}
      </div>

             {/* Quick Stats Footer - Mobile Optimized */}
       {displayedTasks.length > 0 && (
         <Card className="bg-muted/50 border-t-2 border-primary/20">
           <CardContent className="p-3 sm:p-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-xs sm:text-sm text-muted-foreground">
               <span>
                 Showing {displayedTasks.length} of {tasks.length} tasks
               </span>
               <div className="flex items-center space-x-2 sm:space-x-4">
                 <span>
                   {Math.round((taskStats.completed / taskStats.total) * 100) || 0}% completed
                 </span>
                 <div className="w-16 sm:w-20 h-2 bg-muted rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-green-600 transition-all duration-300"
                     style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                   />
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
       
       {/* Bottom Spacing Indicator */}
       <div className="h-2 bg-gradient-to-t from-muted/30 to-transparent rounded-b-lg"></div>
    </div>
  )
}
