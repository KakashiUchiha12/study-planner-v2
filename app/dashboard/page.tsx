"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { TimePicker } from '@/components/ui/time-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, BookOpen, Target, TrendingUp, TrendingDown, Plus, ArrowRight, CheckCircle, CheckCircle2, Circle, AlertTriangle, Award, Users, FileText, BarChart3, Flag, Search, Bell, Settings, LogOut, ChevronDown, X, User, CalendarIcon, Timer, CheckSquare, Square, Zap, Download } from 'lucide-react'
import { useSubjects, useTasks, useStudySessions, useTestMarks } from '@/hooks'
import { useUserSettings } from '@/hooks/useUserSettings'
import { ThemeToggle } from '@/components/theme-toggle'
import { ExpandableSection } from '@/components/expandable-section'
import { ProgressiveTaskManager } from '@/components/progressive-task-manager'
import { TaskManager } from '@/components/tasks/task-manager'
import { ClientOnly } from '@/components/client-only'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { StudyTimer } from '@/components/study-sessions/study-timer'
import TimeTableButton from '@/components/dashboard/TimeTableButton'
import Link from 'next/link'
import { format, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay } from 'date-fns'
import { notificationManager } from '@/lib/notifications'
import { useDataSync } from '@/lib/data-sync'
import type { Task } from '@prisma/client'
import { signOut } from 'next-auth/react'

// Custom hook to avoid hydration mismatch
function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState('morning');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);
  
  return timeOfDay;
}

interface User {
  name: string
  email: string
  university?: string
  program?: string
  year?: number
  avatar?: string
  bio?: string
  badges?: string[]
  isPrivate?: boolean

  currentStreak?: number // consecutive days of studying
  totalStudyTime?: number // total study time this week
}

interface TestMark {
  id: string
  date: string | Date
  subjectId: string
  subjectName: string
  marksObtained: number
  totalMarks: number
  title?: string
  percentage?: number
  grade?: string
}

interface StudySession {
  id: string
  subject: string
  duration: number // in minutes
  date: Date
  notes?: string
  efficiency?: number // 1-10 rating
  sessionType?: "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"
  productivity?: 1 | 2 | 3 | 4 | 5
  topicsCovered?: string[]
  materialsUsed?: string[]
}

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  instructor: string
  color: string
  progress: number // 0-100
  nextExam?: Date
  assignmentsDue?: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  
  const [showTasks, setShowTasks] = useState(false)
  // Use the useTasks hook for proper database integration
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError,
    createTask,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    refreshTasks
  } = useTasks()
  
  // Debug: Log any errors from the useTasks hook
  useEffect(() => {
    if (tasksError) {
      console.error('🔍 Tasks Hook Error:', tasksError)
    }
  }, [tasksError])
  
  // Debug: Log loading state
  useEffect(() => {
    console.log('🔍 Tasks Loading State:', {
      loading: tasksLoading,
      error: tasksError,
      hasTasks: !!tasks,
      tasksCount: tasks?.length || 0
    })
    
    // Log detailed task data
    if (tasks && tasks.length > 0) {
      console.log('🔍 Raw Database Tasks:', tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        category: task.category,
        priority: task.priority,
        description: task.description,
        dueDate: task.dueDate,
        completed: task.completedAt ? true : false,
        allFields: Object.keys(task)
      })))
    }
  }, [tasksLoading, tasksError, tasks])
  
  // Use database tasks instead of local state
  const adaptedTasks = useMemo(() => {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      completed: task.status === 'completed', // Convert status to completed boolean
      createdAt: new Date(task.createdAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority as 'low' | 'medium' | 'high',
      category: task.category || 'Study', // Use actual category or default to 'Study'
      estimatedTime: task.estimatedTime || 0,
      tags: task.tags ? JSON.parse(task.tags) : [],
      subject: task.subjectId || undefined, // Convert null to undefined
      progress: task.progress || 0,
      timeSpent: task.timeSpent || 0
    }))
  }, [tasks])

  // Debug: Log the adapted tasks
  useEffect(() => {
    if (adaptedTasks.length > 0) {
      console.log('🔍 Adapted Tasks for TaskManager:', adaptedTasks.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        category: task.category,
        priority: task.priority,
        status: task.completed ? 'completed' : 'pending'
      })))
    }
  }, [adaptedTasks])

  // Debug: Monitor adaptedTasks for TaskManager
  useEffect(() => {
    console.log('🔍 Dashboard: adaptedTasks updated:', {
      count: adaptedTasks.length,
      tasks: adaptedTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed }))
    })
  }, [adaptedTasks])

  const [taskSort, setTaskSort] = useState("dueDate") // dueDate, priority, createdAt
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // Local state for new task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    estimatedTime: 0,
    tags: [] as string[]
  })
  
  const [newStudySession, setNewStudySession] = useState({
    subjectId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    sessionType: "" as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study" | "",
    productivity: 3 as 1 | 2 | 3 | 4 | 5,
    notes: "",
  })
  const [topicsCovered, setTopicsCovered] = useState<string[]>([])
  const [materialsUsed, setMaterialsUsed] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState("")
  const [newMaterial, setNewMaterial] = useState("")
  
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateStudySession, setShowCreateStudySession] = useState(false)
  const [showStudyTimer, setShowStudyTimer] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [taskFilter, setTaskFilter] = useState("all") // all, pending, completed, overdue
  const { subjects, loading: subjectsLoading } = useSubjects()
  
  // Use the useTestMarks hook for proper database integration
  const { 
    testMarks, 
    loading: testMarksLoading, 
    error: testMarksError,
    createTestMark,
    updateTestMark,
    deleteTestMark,
    refreshTestMarks
  } = useTestMarks()
  
  // Debug: Log test marks data to check database synchronization
  useEffect(() => {
    console.log('🔍 Test Marks Debug:', {
      testMarksCount: testMarks?.length || 0,
      testMarks: testMarks?.map(t => ({
        id: t.id,
        title: t.title,
        subjectName: t.subjectName,
        marksObtained: t.marksObtained,
        totalMarks: t.totalMarks,
        percentage: t.percentage,
        date: t.date
      })),
      loading: testMarksLoading,
      error: testMarksError
    })
    
    // Refresh test marks to ensure we have the latest data
    if (!testMarksLoading && testMarks?.length === 0) {
      console.log('🔄 Refreshing test marks to ensure database sync...')
      refreshTestMarks()
    }
  }, [testMarks, testMarksLoading, testMarksError, refreshTestMarks])
  
  // Use the useStudySessions hook for proper database integration
  const { 
    studySessions: dbStudySessions, 
    createStudySession, 
    loading: studySessionsLoading, 
    error: studySessionsError 
  } = useStudySessions()

  // Create a proper type for StudySession with subject relation
  type StudySessionWithSubject = {
    id: string
    userId: string
    subjectId: string | null
    createdAt: Date
    startTime: Date
    endTime: Date
    notes: string | null
    sessionType: string | null
    productivity: number | null
    topicsCovered: string | null
    materialsUsed: string | null
    durationMinutes: number
    efficiency: number | null
    subject?: {
      id: string
      name: string
      color: string
    } | null
  }

  // Use database study sessions with proper typing
  const studySessions: StudySessionWithSubject[] = dbStudySessions || []
  
  // Debug: Log study sessions data to check database synchronization
  useEffect(() => {
    console.log('🔍 Study Sessions Debug:', {
      studySessionsCount: studySessions?.length || 0,
      studySessions: studySessions?.map(s => ({
        id: s.id,
        startTime: s.startTime,
        startTimeISO: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
        durationMinutes: s.durationMinutes,
        subject: s.subject?.name || 'No Subject'
      })),
      loading: studySessionsLoading,
      error: studySessionsError
    })
    
    // Refresh study sessions to ensure we have the latest data
    if (!studySessionsLoading && studySessions?.length === 0) {
      console.log('🔄 Refreshing study sessions to ensure database sync...')
      // Note: useStudySessions doesn't have refreshStudySessions, so we'll rely on the hook
    }
  }, [studySessions, studySessionsLoading, studySessionsError])
  

  
  // Consolidated date state management
  const [dateState, setDateState] = useState<{
    selected: Date;
    currentMonth: number;
    currentYear: number;
  }>({
    selected: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
  })
  
  const setSelectedDate = (date: Date) => setDateState(prev => ({ ...prev, selected: date }))
  const setCurrentMonth = (month: number) => setDateState(prev => ({ ...prev, currentMonth: month }))
  const setCurrentYear = (year: number) => setDateState(prev => ({ ...prev, currentYear: year }))
  const { selected: selectedDate, currentMonth, currentYear } = dateState

  // Use the new user settings hook
  const { getSetting, settings } = useUserSettings()

  // Force dashboard refresh when settings change
  useEffect(() => {
    if (settings) {
      console.log('🔧 Dashboard: Settings updated, refreshing display', settings)
      // Force a re-render to update all the calculated values
      setShowCreateTask(prev => prev)
    }
  }, [settings])

  // Helper function to get study goal from settings
  const getStudyGoal = () => {
    const goal = getSetting('defaultStudyGoal') / 60 // Convert minutes to hours
    console.log('🔧 Dashboard getStudyGoal called:', { 
      rawSetting: getSetting('defaultStudyGoal'), 
      convertedGoal: goal,
      settingsLoaded: !!settings 
    })
    return goal
  }

  // Helper function to get break duration from settings
  const getBreakDuration = () => {
    return getSetting('breakDuration')
  }

  // Helper function to get reminder time from settings
  const getReminderTime = () => {
    return getSetting('reminderTime')
  }

  // Helper function to get preferred study time from settings
  const getPreferredStudyTime = () => {
    return getSetting('preferredStudyTime')
  }

  // Helper function to check if progress bars should be shown
  const shouldShowProgressBars = () => {
    return getSetting('showProgressBars')
  }

  // Helper function to check if compact mode is enabled
  const isCompactMode = () => {
    return getSetting('compactMode')
  }

  // Helper function to convert minutes to hours and minutes format
  const convertMinutesToHoursAndMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 0) {
      return `${remainingMinutes}m`
    } else if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }
  


  // Custom hook for debounced localStorage persistence
  const useDebouncedPersistence = (key: string, data: any, delay = 300) => {
    const timeoutRef = useRef<NodeJS.Timeout>()
    const isInitialMount = useRef(true)
    
    useEffect(() => {
      // Skip persistence on initial mount to avoid overwriting with default values
      if (isInitialMount.current) {
        isInitialMount.current = false
        return
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(data))
        } catch (error) {
          console.warn(`Failed to persist ${key}:`, error)
        }
      }, delay)
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [key, data, delay])
  }

  // Use debounced persistence for better performance
  useDebouncedPersistence('tasks', tasks)
  useDebouncedPersistence('studySessions', studySessions)
  useDebouncedPersistence('subjects', subjects)
  // Test marks are now managed by the database - no need for localStorage persistence

  const router = useRouter()



  // Unified priority utility functions
  const getPriorityConfig = useCallback((priority: string) => {
    const configs = {
      high: {
        color: "text-red-600 bg-red-100 dark:bg-red-900/20",
        icon: <Flag className="h-3 w-3 fill-current" />,
        label: "High Priority"
      },
      medium: {
        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
        icon: <Flag className="h-3 w-3" />,
        label: "Medium Priority"
      },
      low: {
        color: "text-green-600 bg-green-100 dark:bg-green-900/20",
        icon: <Flag className="h-3 w-3" />,
        label: "Low Priority"
      }
    }
    return configs[priority as keyof typeof configs] || configs.medium
  }, [])

  const getPriorityColor = useCallback((priority: string) => getPriorityConfig(priority).color, [getPriorityConfig])
  const getPriorityIcon = useCallback((priority: string) => getPriorityConfig(priority).icon, [getPriorityConfig])



  // Task management functions - optimized with useCallback
  // Optimized task management functions using functional updates
  // toggleTaskComplete is now provided by the useTasks hook
  
  const updateTaskProgress = useCallback(async (taskId: string, progress: number) => {
    try {
      await updateTask(taskId, { progress })
      
      // Refresh tasks to ensure data consistency
      await refreshTasks()
      
      console.log('✅ Task progress updated successfully')
    } catch (error) {
      console.error('Failed to update task progress:', error)
    }
  }, [updateTask])

  const deleteTaskLocal = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      
      // Refresh tasks to ensure data consistency
      await refreshTasks()
      
      console.log('✅ Task deleted successfully')
    } catch (error) {
      console.error('❌ Failed to delete task:', error)
    }
  }

  const addTimeToTask = useCallback((taskId: string, minutes: number) => {
    // This function is no longer needed as tasks are managed by the database
    // setTasks(prevTasks => 
    //   prevTasks.map(task =>
    //     task.id === taskId ? { ...task, timeSpent: (task.timeSpent || 0) + minutes } : task
    //   )
    // )
  }, [])

  // Date picker helper functions
  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December']
    return months[month]
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session?.user) {
      setUser({
        name: session.user.name || "User",
        email: session.user.email || "",
        university: "University of Technology",
        program: "Computer Science",
        year: 3,
        avatar: "/placeholder-user.jpg",
        bio: "Passionate student focused on software engineering and AI",

        badges: ["Academic Excellence", "Study Streak", "Top Performer"],
        isPrivate: false,
        currentStreak: 5,
        totalStudyTime: 0
      })
    }

    // Load study sessions - now handled by useStudySessions hook
    // No need to load from localStorage anymore

    // Subjects are now loaded via useSubjects hook

    // Tasks are now loaded via useTasks hook - no need to load from localStorage

    // Test marks are now loaded via useTestMarks hook - no need to load from localStorage

    // Restore dashboard section open state
    try {
      const savedSections = localStorage.getItem("dashboard:sections")
      if (savedSections) {
        const parsed = JSON.parse(savedSections)
        if (typeof parsed?.tasks === "boolean") setShowTasks(parsed.tasks)

      }
    } catch (e) {
      // ignore parse errors
    }

    // Notifications are now managed by the database and don't need manual checking
  }, [router, session, status])

  // Persist dashboard section open state
  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard:sections",
        JSON.stringify({ tasks: showTasks })
      )
    } catch (e) {
      // ignore write errors
    }
  }, [showTasks])

  // Debug: Monitor newTask.dueDate changes
  useEffect(() => {
    // Removed debug logging for production
  }, [newTask.dueDate])

  // Use global data synchronization system
  useDataSync('study-session-updated', () => {
    console.log('Study session updated, dashboard will refresh data...')
    // Force a re-render to get fresh data
    setShowCreateStudySession(prev => prev)
  })

  useDataSync('subject-updated', () => {
    console.log('Subject updated, dashboard will refresh data...')
    // Force a re-render to get fresh data
    setShowCreateTask(prev => prev)
  })

  useDataSync('all-data-refresh', () => {
    console.log('All data refresh requested, dashboard will refresh...')
    // Force a complete refresh
    setShowCreateTask(prev => prev)
    setShowCreateStudySession(prev => prev)
  })

  const addTask = async () => {
    if (!newTask.title.trim()) return

    try {
      // Create task in database using the API
      const createdTask = await createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        dueDate: newTask.dueDate?.toISOString(),
        priority: newTask.priority,
        status: 'pending' as const,
        category: newTask.category || 'Study',
        estimatedTime: newTask.estimatedTime || undefined
      })
      
      if (createdTask) {
        console.log('✅ Task created successfully:', createdTask)
        
        // Refresh tasks to ensure data consistency
        await refreshTasks()
      }
      
      // Reset form
      setNewTask({
        title: "",
        description: "",
        dueDate: undefined,
        priority: "medium",
        category: "",
        estimatedTime: 0,
        tags: []
      })
      setShowCreateTask(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      // You could add error handling UI here
    }
  }

  const addStudySession = async () => {
    if (!newStudySession.subjectId || !newStudySession.sessionType || !newStudySession.startTime || !newStudySession.endTime) return

    const selectedSubject = subjects.find((s) => s.id === newStudySession.subjectId)
    if (!selectedSubject) return

    const duration = calculateDuration(newStudySession.startTime, newStudySession.endTime)
    if (duration <= 0) return

    try {
      // Create study session using the database API
      const sessionData = {
        subjectId: newStudySession.subjectId,
        durationMinutes: duration,
        startTime: new Date(`${newStudySession.date}T${newStudySession.startTime}:00`),
        endTime: new Date(`${newStudySession.date}T${newStudySession.endTime}:00`),
        notes: newStudySession.notes.trim(),
        sessionType: newStudySession.sessionType as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study",
        productivity: newStudySession.productivity,
        topicsCovered: topicsCovered.length > 0 ? JSON.stringify(topicsCovered) : null,
        materialsUsed: materialsUsed.length > 0 ? JSON.stringify(materialsUsed) : null
      }

      const createdSession = await createStudySession(sessionData)
      
      if (createdSession) {
        console.log('✅ Study session created successfully:', createdSession)
        
        // Notify other parts of the application about the session creation
        // triggerUpdate removed - no longer needed
        
        // Reset form
        setNewStudySession({
          subjectId: "",
          date: new Date().toISOString().split("T")[0],
          startTime: "",
          endTime: "",
          sessionType: "",
          productivity: 3,
          notes: "",
        })
        setTopicsCovered([])
        setMaterialsUsed([])
        setNewTopic("")
        setNewMaterial("")
        setShowCreateStudySession(false)
      }
    } catch (error) {
      console.error('❌ Failed to create study session:', error)
    }
  }

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    return Math.max(0, Math.round(diff / (1000 * 60))) // Convert to minutes
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

  const removeTask = (taskId: string) => {
    // This function is no longer needed as tasks are managed by the database
    // const updatedTasks = tasks.filter((task) => task.id !== taskId)
    // setTasks(updatedTasks)
  }

  // Memoized calculations for better performance
  const todayStudyTime = useMemo(() => {
    const today = new Date()
    return studySessions
      .filter(session => {
        const sessionStartTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime)
        return isToday(sessionStartTime)
      })
      .reduce((total, session) => total + session.durationMinutes, 0)
  }, [studySessions])

  const weeklyStudyTime = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    
    console.log('🔍 Weekly Study Time Debug:', {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalSessions: studySessions.length,
      sessions: studySessions.map(s => ({
        id: s.id,
        startTime: s.startTime,
        startTimeISO: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
        durationMinutes: s.durationMinutes,
        subject: s.subject
      }))
    })
    
    const weeklySessions = studySessions.filter(session => {
      // Ensure startTime is a Date object
      const sessionStartTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime)
      const isInWeek = sessionStartTime >= weekStart && sessionStartTime <= weekEnd
      console.log(`Session ${session.id}: ${sessionStartTime.toISOString()} in week? ${isInWeek}`)
      return isInWeek
    })
    
    const total = weeklySessions.reduce((total, session) => total + session.durationMinutes, 0)
    
    console.log('📊 Weekly Study Time Result:', {
      weeklySessionsCount: weeklySessions.length,
      totalMinutes: total,
      totalHours: Math.round(total / 60 * 10) / 10
    })
    
    return total
  }, [studySessions])

  const studyStreak = useMemo(() => {
    if (studySessions.length === 0) return 0
    
    // Create a Set of date strings for O(1) lookup
    const sessionDates = new Set(
      studySessions.map(session => {
        // Handle both Date objects and string dates from database
        let sessionStartTime: Date
        if (session.startTime instanceof Date) {
          sessionStartTime = session.startTime
        } else if (typeof session.startTime === 'string') {
          sessionStartTime = new Date(session.startTime)
        } else {
          // Fallback for any other type
          sessionStartTime = new Date()
        }
        
        // Ensure the date is valid
        if (isNaN(sessionStartTime.getTime())) {
          console.warn('Invalid date in study session:', session.startTime)
          return null
        }
        
        return `${sessionStartTime.getFullYear()}-${String(sessionStartTime.getMonth() + 1).padStart(2, '0')}-${String(sessionStartTime.getDate()).padStart(2, '0')}`
      }).filter(Boolean) // Remove null values
    )
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      
      if (sessionDates.has(dateString)) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }, [studySessions])

  const upcomingDeadlines = useMemo(() => {
    // Show all pending tasks, prioritizing those with due dates
    const pendingTasks = adaptedTasks.filter(task => !task.completed)
    
    // Sort by priority: overdue first, then due soon, then no due date
    return pendingTasks.sort((a, b) => {
      // If both have due dates, sort by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      
      // If only one has due date, prioritize the one with due date
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      
      // If neither has due date, sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [adaptedTasks])

  // Helper function for task overdue check
  const isTaskOverdue = (task: any) => {
    if (!task.dueDate || task.completed) return false;
    return isPast(task.dueDate) && !isToday(task.dueDate);
  };

  const taskStats = useMemo(() => {
    const completed = adaptedTasks.filter((task) => task.completed).length
    const pending = adaptedTasks.filter((task) => !task.completed).length
    const overdue = adaptedTasks.filter((task) => isTaskOverdue(task)).length
    const highPriority = adaptedTasks.filter((task) => !task.completed && task.priority === "high").length
    
    return { completed, pending, overdue, highPriority }
  }, [adaptedTasks])

  const averageScore = useMemo(() => {
    return testMarks.length > 0
      ? Math.round(testMarks.reduce((sum, test) => {
          // Calculate percentage from score and maxScore (actual database fields)
          const score = test.score || 0
          const maxScore = test.maxScore || 1
          const percentage = (score / maxScore) * 100
          return sum + percentage
        }, 0) / testMarks.length)
      : 0
  }, [testMarks])

  // Debug: Log calculated values to check if they're updating
  useEffect(() => {
    console.log('🔍 Calculated Values Debug:', {
      averageScore,
      studyStreak,
      taskStats,
      testMarksCount: testMarks?.length || 0,
      studySessionsCount: studySessions?.length || 0
    })
  }, [averageScore, studyStreak, taskStats, testMarks, studySessions])

  // Debug: Log testMarks data structure to diagnose the issue
  useEffect(() => {
    if (testMarks && testMarks.length > 0) {
      console.log('🔍 TestMarks Data Structure Debug:', {
        count: testMarks.length,
        firstTest: testMarks[0],
        allTests: testMarks.map(t => ({
          id: t.id,
          testName: t.testName,
          subjectId: t.subjectId,
          score: t.score,
          maxScore: t.maxScore,
          calculatedPercentage: ((t.score || 0) / (t.maxScore || 1)) * 100,
          testDate: t.testDate,
          allFields: Object.keys(t)
        }))
      })
    } else {
      console.log('🔍 TestMarks Debug: No test marks found or empty array')
    }
  }, [testMarks])

  // Debug: Log studySessions data structure to diagnose the study streak issue
  useEffect(() => {
    if (studySessions && studySessions.length > 0) {
      console.log('🔍 StudySessions Data Structure Debug:', {
        count: studySessions.length,
        firstSession: studySessions[0],
        allSessions: studySessions.map(s => ({
          id: s.id,
          startTime: s.startTime,
          startTimeISO: s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime),
          durationMinutes: s.durationMinutes,
          subject: s.subject?.name || 'No Subject',
          allFields: Object.keys(s)
        }))
      })
    } else {
      console.log('🔍 StudySessions Debug: No study sessions found or empty array')
    }
  }, [studySessions])

  const subjectsProgress = useMemo(() => {
    return subjects.reduce((sum, s) => sum + (s.progress || 0), 0) / Math.max(subjects.length, 1)
  }, [subjects])

  // Daily study hours by subject for the current month
  const dailyStudyHoursBySubject = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    // Initialize data structure for each day and subject
    const dailyData: { [day: number]: { [subjectName: string]: number } } = {}
    
    // Initialize all days with 0 hours for all subjects
    for (let day = 1; day <= daysInMonth; day++) {
      dailyData[day] = {}
      subjects.forEach(subject => {
        dailyData[day][subject.name] = 0
      })
    }
    
    // Fill in actual study data
    studySessions.forEach(session => {
      const sessionStartTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime)
      
      // Only include sessions from current month
      if (sessionStartTime.getMonth() === currentMonth && sessionStartTime.getFullYear() === currentYear) {
        const day = sessionStartTime.getDate()
        const subjectName = session.subject?.name || 'Unknown Subject'
        const hours = session.durationMinutes / 60
        
        if (!dailyData[day]) {
          dailyData[day] = {}
        }
        if (!dailyData[day][subjectName]) {
          dailyData[day][subjectName] = 0
        }
        
        dailyData[day][subjectName] += hours
      }
    })
    
    return dailyData
  }, [studySessions, subjects])

  // Unified task update function
  const updateTaskLocal = useCallback(async (taskId: string, updates: any) => {
    try {
      await updateTask(taskId, updates)
      
      // Refresh tasks to ensure data consistency
      await refreshTasks()
      
      // Notify other parts of the application about the task update
      // triggerUpdate removed - no longer needed
      
      // Also trigger a general task refresh
      // triggerUpdate removed - no longer needed
      
      console.log('✅ Task updated successfully')
    } catch (error) {
      console.error('❌ Failed to update task:', error)
    }
  }, [updateTask])



  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const timeOfDay = useTimeOfDay();

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM dd");
  };

  // Debug: Log task data to check for mismatches
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('🔍 Tasks Data Debug:', {
        totalTasks: tasks.length,
        taskSample: tasks.slice(0, 2).map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          hasStatus: 'status' in task,
          statusType: typeof task.status,
          allFields: Object.keys(task)
        }))
      })
    }
  }, [tasks])

  // Handle task reordering (drag and drop)
  const handleTaskReorder = useCallback((reorderedTasks: Task[]) => {
    console.log('🔍 Task Reorder:', {
      originalCount: tasks.length,
      reorderedCount: reorderedTasks.length,
      tasks: reorderedTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority }))
    })
    
    // TODO: In the future, we can add an API endpoint to save the new order
    // For now, we'll just log the reordering
    console.log('📝 Tasks reordered:', reorderedTasks)
  }, [tasks])

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Task filtering and sorting
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === "pending") return task.status !== 'completed'
    if (taskFilter === "completed") return task.status === 'completed'
    if (taskFilter === "overdue") return isTaskOverdue(task)
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0
    
    switch (taskSort) {
      case "dueDate":
        if (!a.dueDate && !b.dueDate) comparison = 0
        else if (!a.dueDate) comparison = 1
        else if (!b.dueDate) comparison = -1
        else {
          // Ensure dueDate is a Date object before calling getTime()
          const aDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)
          const bDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)
          comparison = aDate.getTime() - bDate.getTime()
        }
        break
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = a.priority as 'high' | 'medium' | 'low'
        const bPriority = b.priority as 'high' | 'medium' | 'low'
        comparison = (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0)
        break
      case "createdAt":
        comparison = a.createdAt.getTime() - b.createdAt.getTime()
        break
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  const { completed: completedTasks, pending: pendingTasks, overdue: overdueTasks, highPriority: highPriorityTasks } = taskStats

  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean)))

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Minimal Header with Glass Effect - Mobile Optimized */}
      <header className="glass-effect border-b border-border/50 sticky top-0 z-40">
        <div className="container-responsive py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3 animate-slide-in-right">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg sm:text-heading-2 font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                StudyPlanner
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">Your academic companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <NotificationCenter />
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 focus-ring">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 sm:h-9 sm:w-9 p-0 focus-ring">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced Search Bar - Mobile Optimized */}
        <div className="border-t border-border/30 bg-gradient-to-r from-muted/20 to-muted/10">
          <div className="container-responsive py-2 sm:py-3">
            <div className="relative animate-fade-in-up">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, subjects, study sessions..."
                className="input-enhanced pl-10 shadow-sm h-10 sm:h-11 text-sm sm:text-base"
                onChange={(e) => {
                  // Implement search functionality
                  const query = e.target.value.toLowerCase()
                  // You can add search logic here to filter content
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container-responsive py-6 sm:py-8 md:py-12">
        {/* Enhanced Primary Focus View - Mobile Optimized */}
        <div className="text-center space-y-8 sm:space-y-12 animate-fade-in-up">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-heading-1 font-light text-foreground">
                Good {timeOfDay}, {user.name}
              </h1>
              <p className="text-sm sm:text-caption">Welcome back to your study journey</p>
            </div>
            
            <div className="relative">
              {/* Study Time Display with Enhanced Visual Appeal - Mobile Optimized */}
              <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent-purple/5"></div>
                                  <div className="relative space-y-3 sm:space-y-4">
                    <ClientOnly fallback={<div className="text-4xl sm:text-display font-light bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent">0h</div>}>
                      <div className="text-4xl sm:text-display font-light bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent">
                        {Math.round(todayStudyTime / 60 * 10) / 10}h
                      </div>
                    </ClientOnly>
                    <p className="text-base sm:text-body-large text-muted-foreground">
                      of {getStudyGoal()}h daily goal
                    </p>
                  
                  {/* Enhanced Progress Bar - Client Only - Mobile Optimized */}
                  {shouldShowProgressBars() && (
                    <ClientOnly fallback={
                      <div className="max-w-xs sm:max-w-sm mx-auto space-y-2 sm:space-y-3">
                        <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-muted rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0h</span>
                          <span className="font-medium">0% complete</span>
                          <span>{getStudyGoal()}h</span>
                        </div>
                      </div>
                    }>
                      <div className="max-w-xs sm:max-w-sm mx-auto space-y-2 sm:space-y-3">
                        <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-700 ease-out shadow-sm"
                            style={{ 
                              width: `${Math.min((todayStudyTime / 60) / getStudyGoal() * 100, 100)}%` 
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0h</span>
                          <span className="font-medium">
                            {Math.round((todayStudyTime / 60) / getStudyGoal() * 100)}% complete
                          </span>
                          <span>{getStudyGoal()}h</span>
                        </div>
                      </div>
                    </ClientOnly>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* TimeTable Button */}
          <TimeTableButton />
          
          {/* Enhanced Primary Action - Mobile Optimized */}
          <Button 
            size="lg" 
            className="btn-primary-enhanced px-6 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in w-full sm:w-auto"
            onClick={() => setShowStudyTimer(true)}
          >
            <Timer className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
            Start Study Session
            <div className="ml-2 sm:ml-3 w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
          </Button>
          
          {/* Urgent Tasks (Progressive Disclosure) - Mobile Optimized */}
          <ClientOnly fallback={null}>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {tasks.length === 0 ? (
                  <div>
                    <p>No tasks found. Create your first task to get started!</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateTask(true)}
                      className="mt-2"
                    >
                      Create Task
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>All tasks completed! Great job!</p>
                    <p className="text-sm mt-1">You have {tasks.filter(t => t.status === 'completed').length} completed tasks</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-4 sm:pt-6 border-t border-border/50">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Pending Tasks
                </h2>
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 3).map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm sm:text-base">
                          {task.title}
                        </p>
                        <p className="text-xs sm:text-sm text-warning">
                          {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {upcomingDeadlines.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowTasks(true)}
                    className="text-primary text-sm"
                  >
                    +{upcomingDeadlines.length - 3} more pending tasks
                  </Button>
                )}
                
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    💡 Go to the <strong>Tasks</strong> section below to mark tasks as complete
                  </p>
                </div>
              </div>
            )}
          </ClientOnly>
          
          {/* Secondary Metrics (Minimal) */}
          <ClientOnly fallback={null}>
            {studyStreak > 0 && (
              <div className="pt-4 text-sm text-muted-foreground">
                🔥 {studyStreak} day study streak
              </div>
            )}
          </ClientOnly>
        </div>

                  {/* Enhanced Progressive Disclosure Sections */}
        <div className="mt-16 space-y-8">
          {/* Study Progress - Expandable */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <ExpandableSection 
              title="Study Progress" 
              icon={BarChart3}
              defaultExpanded={false}
            >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-light text-primary">
                    {studySessions.filter(s => isToday(s.startTime)).length}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sessions Today</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-light text-success">
                    {Math.round(weeklyStudyTime / 60)}h
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-light text-warning">
                    {studyStreak}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Goal</span>
                  <span className="text-foreground">
                    {Math.round(weeklyStudyTime / 60)}h / {getStudyGoal() * 7}h
                  </span>
                </div>
                <Progress value={(weeklyStudyTime / 60) / (getStudyGoal() * 7) * 100} className="h-2" />
              </div>
            </div>
          </ExpandableSection>
          </div>

          {/* Quick Actions - Minimal - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 p-2 sm:p-3"
              onClick={() => setShowCreateTask(true)}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Quick Task</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 p-2 sm:p-3"
              onClick={() => router.push('/subjects')}
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Subjects</span>
            </Button>
          </div>

          {/* Enhanced Quick Actions Dashboard - Expandable - Mobile Optimized */}
          <ExpandableSection 
            title="Quick Actions" 
            icon={Zap}
            defaultExpanded={false}
          >
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              {/* Log Study Session */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowCreateStudySession(true)}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Log Study Session</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Add a completed study session</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Click to log session
                  </div>
                </CardContent>
              </Card>

              {/* Study Sessions */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/study-sessions')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Study History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">View your study sessions</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {studySessions.length} sessions logged
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/test-marks')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Test Results</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Track your performance</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {testMarks.length} tests recorded
                  </div>
                </CardContent>
              </Card>

              {/* Profile */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Profile</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage your account</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ExpandableSection>

          {/* Dashboard Stats - Expandable */}
          <ExpandableSection 
            title="Performance Overview" 
            icon={BarChart3}
            defaultExpanded={false}
          >
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Tasks</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.completed} completed, {taskStats.pending} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Test Average</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {averageScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {testMarks.length} test{testMarks.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Study Streak</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{studyStreak}</div>
                  <p className="text-xs text-muted-foreground">
                    Days in a row
                  </p>
                </CardContent>
              </Card>
            </div>
          </ExpandableSection>

          {/* Subjects Overview - Expandable */}
          <ExpandableSection 
            title="Subjects Overview" 
            icon={BookOpen}
            defaultExpanded={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Subjects</h3>
                <Link href="/subjects">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <h4 className="font-medium">{subject.name}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {subject.credits} credits
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{subject.progress}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Instructor:</span>
                            <span>{subject.instructor}</span>
                          </div>
                          {subject.assignmentsDue && subject.assignmentsDue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due:</span>
                              <span className="text-orange-600 font-medium">
                                {subject.assignmentsDue} assignment{subject.assignmentsDue !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {subject.nextExam && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Next Exam:</span>
                              <span className="text-red-600 font-medium">
                                {format(subject.nextExam, "MMM dd")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ExpandableSection>

          {/* Tasks - Expandable */}
          <ExpandableSection 
            title={`Tasks (${tasks.length})`} 
            icon={CheckCircle2}
            defaultExpanded={false}
          >
            <div className="space-y-6">
              {/* Task Summary Stats - Mobile Optimized */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-primary">{taskStats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-warning">{taskStats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-destructive">{taskStats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">{taskStats.highPriority}</div>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
              </div>

              {/* Enhanced Task Manager with Drag & Drop */}
              <div className="min-h-0">
                <TaskManager
                  tasks={adaptedTasks}
                  onTasksChange={async (updatedTasks: any[]) => {
                    console.log('🔍 TaskManager onTasksChange called with:', updatedTasks.length, 'tasks')
                    
                    // Check if any tasks were deleted
                    const deletedTasks = adaptedTasks.filter(originalTask => 
                      !updatedTasks.find(updatedTask => updatedTask.id === originalTask.id)
                    )
                    
                    if (deletedTasks.length > 0) {
                      console.log('🔍 Task deletions detected:', deletedTasks.map(t => ({
                        id: t.id,
                        title: t.title
                      })))
                      
                      // Delete tasks from database
                      for (const deletedTask of deletedTasks) {
                        try {
                          console.log('🔄 Deleting task:', deletedTask.id)
                          await deleteTask(deletedTask.id)
                          console.log('✅ Task deleted successfully:', deletedTask.id)
                        } catch (error) {
                          console.error('❌ Failed to delete task:', error)
                        }
                      }
                      
                      // Refresh tasks to ensure data consistency
                      await refreshTasks()
                      
                      // Notify other parts of the application about the task deletion
                      // triggerUpdate removed - no longer needed
                    }
                    
                    // Check if any tasks were completed/uncompleted
                    const completionChanges = updatedTasks.filter(updatedTask => {
                      const originalTask = adaptedTasks.find(t => t.id === updatedTask.id)
                      const hasChanged = originalTask && originalTask.completed !== updatedTask.completed
                      
                      if (hasChanged) {
                        console.log('🔍 Task completion change detected:', {
                          taskId: updatedTask.id,
                          taskTitle: updatedTask.title,
                          originalCompleted: originalTask?.completed,
                          newCompleted: updatedTask.completed,
                          originalStatus: tasks.find(t => t.id === updatedTask.id)?.status,
                          newStatus: updatedTask.completed ? 'completed' : 'pending'
                        })
                      }
                      
                      return hasChanged
                    })
                    
                    if (completionChanges.length > 0) {
                      console.log('🔍 Task completion changes detected:', completionChanges.map(t => ({
                        id: t.id,
                        title: t.title,
                        completed: t.completed
                      })))
                      
                      // Update task completion status in database
                      for (const changedTask of completionChanges) {
                        try {
                          console.log('🔄 Updating task completion for:', changedTask.id, 'to:', changedTask.completed)
                          console.log('🔄 Task details:', {
                            id: changedTask.id,
                            title: changedTask.title,
                            completed: changedTask.completed,
                            status: changedTask.completed ? 'completed' : 'pending'
                          })
                          
                          await toggleTaskComplete(changedTask.id)
                          console.log('✅ Task completion status updated for:', changedTask.id)
                          
                          // Refresh tasks to ensure data consistency
                          await refreshTasks()
                        } catch (error) {
                          console.error('❌ Failed to update task completion:', error)
                        }
                      }
                    }
                    
                    // Check if tasks were reordered by comparing the order of task IDs
                    const originalOrder = adaptedTasks.map(t => t.id)
                    const newOrder = updatedTasks.map(t => t.id)
                    const isReordering = JSON.stringify(originalOrder) !== JSON.stringify(newOrder)
                    
                    console.log('🔍 Reordering check:', {
                      originalOrder,
                      newOrder,
                      isReordering,
                      originalLength: originalOrder.length,
                      newLength: newOrder.length
                    })
                    
                    if (isReordering) {
                      console.log('🔍 Task reordering detected')
                      console.log('🔍 Original order:', originalOrder)
                      console.log('🔍 New order:', newOrder)
                      
                      try {
                        // Save the new order to the database
                        const response = await fetch('/api/tasks', {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ tasks: updatedTasks }),
                        })
                        
                        if (response.ok) {
                          console.log('✅ Task order saved successfully')
                          
                          // Refresh tasks to ensure data consistency
                          await refreshTasks()
                          
                          // Notify other parts of the application about the task reordering
                          triggerUpdate("task-reordered", { 
                            tasks: updatedTasks.map(t => ({ id: t.id, title: t.title }))
                          })
                        } else {
                          console.error('❌ Failed to save task order')
                        }
                      } catch (error) {
                        console.error('❌ Error saving task order:', error)
                      }
                    } else {
                      console.log('🔍 No reordering detected - tasks are in the same order')
                    }
                  }}
                  onOpenCreateDialog={() => setShowCreateTask(true)}
                />
              </div>
            </div>
          </ExpandableSection>

          {/* Comprehensive Analytics - Expandable */}
          <ExpandableSection 
            title="Analytics & Insights" 
            icon={BarChart3}
            defaultExpanded={false}
          >
            <div className="space-y-6">
              {/* Study Time Analytics */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Study Time Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-primary">
                      {convertMinutesToHoursAndMinutes(todayStudyTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <div className="mt-2">
                      <Progress value={(todayStudyTime / 60) / getStudyGoal() * 100} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-success">
                      {convertMinutesToHoursAndMinutes(weeklyStudyTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <div className="mt-2">
                      <Progress value={(weeklyStudyTime / 60) / (getStudyGoal() * 7) * 100} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-warning">
                      {studyStreak}
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      🔥 Keep it up!
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Performance Overview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Test Average</span>
                      <span className="text-lg font-semibold text-foreground">{averageScore}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on {testMarks.length} test{testMarks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Subject Progress</span>
                      <span className="text-lg font-semibold text-foreground">{Math.round(subjectsProgress)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Recent Activity</h4>
                <div className="space-y-2">
                  {studySessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{session.subject?.name || 'Unknown Subject'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(session.startTime, "MMM dd, HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {convertMinutesToHoursAndMinutes(session.durationMinutes)}
                      </div>
                    </div>
                  ))}
                  
                  {studySessions.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No study sessions yet. Start your first session!
                    </p>
                  )}
                </div>
              </div>

              {/* Daily Study Hours by Subject - Monthly View */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Study Hours by Day (This Month)</h4>
                <div className="bg-muted/20 rounded-lg p-4">
                  {/* Subject Legend */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {subjects.map((subject, index) => (
                      <div key={subject.id} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color || `hsl(${index * 137.5 % 360}, 70%, 60%)` }}
                        ></div>
                        <span className="text-xs text-muted-foreground">{subject.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Daily Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                    
                    {/* Daily data */}
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1
                      const currentDate = new Date()
                      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth()
                      
                      const dayData = dailyStudyHoursBySubject[day] || {}
                      const totalHours = Object.values(dayData).reduce((sum, hours) => sum + hours, 0)
                      
                      return (
                        <div 
                          key={i} 
                          className="min-h-[60px] p-1 border border-border/20 rounded bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                          title={`Day ${day}: ${totalHours > 0 ? `${Math.round(totalHours * 10) / 10}h` : '0h'}`}
                        >
                          <div className="text-center text-xs text-muted-foreground mb-1">
                            {day}
                          </div>
                          {isCurrentMonth && totalHours > 0 ? (
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-foreground text-center">
                                {Math.round(totalHours * 10) / 10}h
                              </div>
                              {/* Subject breakdown with colors */}
                              {Object.entries(dayData)
                                .filter(([_, hours]) => hours > 0)
                                .slice(0, 3) // Show max 3 subjects per day
                                .map(([subjectName, hours]) => {
                                  const subject = subjects.find(s => s.name === subjectName)
                                  const color = subject?.color || `hsl(${Math.random() * 360}, 70%, 60%)`
                                  return (
                                    <div key={subjectName} className="text-center">
                                      <div className="text-[10px] font-medium truncate" style={{ color }}>
                                        {subjectName}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {Math.round(hours * 10) / 10}h
                                      </div>
                                    </div>
                                  )
                                })}
                              {Object.entries(dayData).filter(([_, hours]) => hours > 0).length > 3 && (
                                <div className="text-[10px] text-muted-foreground text-center">
                                  +{Object.entries(dayData).filter(([_, hours]) => hours > 0).length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-xs">
                              {isCurrentMonth ? '0h' : '-'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* View Full Analytics Button */}
              <div className="pt-4 border-t border-border/30">
                <Link href="/analytics">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </ExpandableSection>


        </div>
      </main>

      {/* Back to Top Button - Mobile Optimized */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background/90 hover:shadow-xl transition-all duration-200 focus-ring md:hidden"
        title="Back to Top"
      >
        <ChevronDown className="h-5 w-5 rotate-180" />
      </Button>



      {/* Enhanced Study Timer Component */}
      <StudyTimer 
        subjects={subjects}
        isOpen={showStudyTimer}
        onOpenChange={setShowStudyTimer}
        defaultDuration={getSetting('defaultStudyGoal')}
        breakDuration={getBreakDuration()}
        showBreakReminders={getSetting('breakReminders')}
        onSessionComplete={async (session: any) => {
          try {
            // Create study session using the database API
            const sessionData = {
              subjectId: session.subjectId,
              durationMinutes: session.duration,
              startTime: new Date(`${session.date}T${session.startTime}:00`),
              endTime: new Date(`${session.date}T${session.endTime}:00`),
              notes: session.notes,
              sessionType: session.sessionType,
              productivity: session.productivity,
              topicsCovered: session.topicsCovered?.length > 0 ? JSON.stringify(session.topicsCovered) : null,
              materialsUsed: session.materialsUsed?.length > 0 ? JSON.stringify(session.materialsUsed) : null,
              // Use user settings for session defaults
              targetDuration: getSetting('defaultStudyGoal'),
              breakDuration: getBreakDuration(),
              reminderTime: getReminderTime()
            }

            const createdSession = await createStudySession(sessionData)
            
            if (createdSession) {
              console.log('✅ Study timer session created successfully:', createdSession)
              
              // Notify other parts of the application about the session creation
              // triggerUpdate removed - no longer needed
            }
          } catch (error) {
            console.error('❌ Failed to create study timer session:', error)
          }
          
          setShowStudyTimer(false)
        }}
      />

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[500px] sm:max-h-[80vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: "low" | "medium" | "high") => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Study, Assignment"
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    onClick={() => {
                      setDatePickerOpen(!datePickerOpen);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(newTask.dueDate, "PPP") : "Pick a date"}
                  </Button>
                  
                  {/* Enhanced date picker with month/year navigation */}
                  <ClientOnly fallback={null}>
                    {datePickerOpen && (
                      <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3 sm:p-4 w-72 sm:w-80">
                        {/* Month/Year Navigation */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <button
                            onClick={() => navigateMonth('prev')}
                            className="p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                          </button>
                          <div className="text-base sm:text-lg font-medium text-popover-foreground">
                            {getMonthName(currentMonth)} {currentYear}
                          </div>
                          <button
                            onClick={() => navigateMonth('next')}
                            className="p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-1.5 sm:p-2 text-xs text-muted-foreground text-center font-medium">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Empty cells for days before the first day of month */}
                          {Array.from({length: getFirstDayOfMonth(currentMonth, currentYear)}, (_, i) => (
                            <div key={`empty-${i}`} className="p-1.5 sm:p-2"></div>
                          ))}
                          
                          {/* Date cells */}
                          {Array.from({length: getDaysInMonth(currentMonth, currentYear)}, (_, i) => {
                            const day = i + 1
                            const date = new Date(currentYear, currentMonth, day)
                            const isToday = date.toDateString() === new Date().toDateString()
                            const isSelected = newTask.dueDate && date.toDateString() === newTask.dueDate.toDateString()
                            const isPast = date < new Date() && !isToday
                            
                            return (
                              <button
                                key={day}
                                className={`p-1.5 sm:p-2 text-xs sm:text-sm rounded transition-colors ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground' 
                                    : isToday 
                                      ? 'bg-accent text-accent-foreground font-medium' 
                                      : isPast
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                                onClick={() => {
                                  if (isPast) return // Prevent selecting past dates
                                  console.log('Date selected:', date.toISOString());
                                  setNewTask({...newTask, dueDate: date});
                                  setDatePickerOpen(false);
                                }}
                                disabled={isPast}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </ClientOnly>
                </div>
                {/* Debug info */}
                <div className="text-xs text-muted-foreground mt-1">
                  Debug: {newTask.dueDate ? `Date set: ${newTask.dueDate.toString()}` : 'No date set'}
                </div>
              </div>
              <div>
                <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  placeholder="30"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button onClick={addTask} disabled={!newTask.title.trim()}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Study Session Dialog */}
      <Dialog open={showCreateStudySession} onOpenChange={setShowCreateStudySession}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[500px] sm:max-h-[80vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionSubject">Subject *</Label>
                <Select onValueChange={(value) => setNewStudySession({...newStudySession, subjectId: value})}>
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
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select onValueChange={(value) => setNewStudySession({...newStudySession, sessionType: value as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"})}>
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

            <div>
              <Label htmlFor="sessionDate">Date</Label>
              <Input
                id="sessionDate"
                type="date"
                value={newStudySession.date}
                onChange={(e) => setNewStudySession({...newStudySession, date: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <TimePicker
                  value={newStudySession.startTime}
                  onChange={(time) => setNewStudySession({...newStudySession, startTime: time})}
                  placeholder="Select start time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <TimePicker
                  value={newStudySession.endTime}
                  onChange={(time) => setNewStudySession({...newStudySession, endTime: time})}
                  placeholder="Select end time"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                  {calculateDuration(newStudySession.startTime, newStudySession.endTime) > 0 
                    ? `${Math.floor(calculateDuration(newStudySession.startTime, newStudySession.endTime) / 60)}h ${calculateDuration(newStudySession.startTime, newStudySession.endTime) % 60}m` 
                    : "0m"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topics Covered</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Add topic (e.g., Derivatives, Newton's Laws)"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addTopic} className="sm:w-auto">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {topicsCovered.length > 0 && (
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
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Add material (e.g., Textbook, Khan Academy)"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addMaterial} className="sm:w-auto">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {materialsUsed.length > 0 && (
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
                value={newStudySession.productivity.toString()}
                onValueChange={(value) =>
                  setNewStudySession({ ...newStudySession, productivity: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 })
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

            <div>
              <Label htmlFor="sessionNotes">Notes (Optional)</Label>
              <Textarea
                id="sessionNotes"
                placeholder="Add notes about your session, what you learned, areas to improve..."
                value={newStudySession.notes}
                onChange={(e) => setNewStudySession({...newStudySession, notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateStudySession(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addStudySession} 
                disabled={!newStudySession.subjectId || !newStudySession.sessionType || !newStudySession.startTime || !newStudySession.endTime}
              >
                Log Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
