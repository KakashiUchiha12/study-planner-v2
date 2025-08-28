"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Calendar as CalendarIcon, Tag, Filter, SortAsc, SortDesc, MoreHorizontal } from "lucide-react"
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category?: string
  dueDate?: Date
  estimatedTime?: number
  createdAt: Date
  tags: string[]
}

interface ProgressiveTaskManagerProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
}

export function ProgressiveTaskManager({ 
  tasks, 
  onTaskUpdate, 
  onTaskDelete 
}: ProgressiveTaskManagerProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    switch (filter) {
      case "pending":
        filtered = filtered.filter(task => !task.completed)
        break
      case "completed":
        filtered = filtered.filter(task => task.completed)
        break
      case "overdue":
        filtered = filtered.filter(task => isTaskOverdue(task))
        break
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sort) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else comparison = a.dueDate.getTime() - b.dueDate.getTime()
          break
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [tasks, filter, sort, sortDirection, searchQuery])

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false
    return isPast(task.dueDate) && !isToday(task.dueDate)
  }

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "MMM dd")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200"
      case "medium": return "text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200"
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200"
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <div className="w-2 h-2 bg-red-600 rounded-full" />
      case "medium": return <div className="w-2 h-2 bg-orange-600 rounded-full" />
      case "low": return <div className="w-2 h-2 bg-green-600 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-600 rounded-full" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Basic Filters */}
      <div className="space-y-3">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          >
            {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {/* Task List */}
      <div className="space-y-2">
        {filteredAndSortedTasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            {filter === "all" ? "No tasks yet. Create one to get started!" : `No ${filter} tasks found.`}
          </p>
        ) : (
          filteredAndSortedTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                task.completed 
                  ? "bg-muted/30 border-muted" 
                  : isTaskOverdue(task)
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTaskUpdate(task.id, { completed: !task.completed })}
                className="p-0 h-auto"
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {task.title}
                </p>
                
                {task.dueDate && (
                  <p className={`text-sm mt-1 ${
                    isTaskOverdue(task) && !task.completed ? "text-red-600 font-medium" : "text-muted-foreground"
                  }`}>
                    {formatDueDate(task.dueDate)}
                  </p>
                )}
              </div>
              
              {task.priority === 'high' && !task.completed && (
                <div className="w-2 h-2 bg-red-600 rounded-full" aria-label="High priority" />
              )}
            </div>
          ))
        )}
      </div>
      
      {/* View All Tasks */}
      {filteredAndSortedTasks.length > 5 && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm">
            View All {filteredAndSortedTasks.length} Tasks
          </Button>
        </div>
      )}
    </div>
  )
}
