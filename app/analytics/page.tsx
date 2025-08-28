"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Clock, Target, BookOpen, Award, Download, ArrowLeft, HelpCircle } from "lucide-react"
import { startOfDay, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, addDays } from "date-fns"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useStudySessions, useTestMarks, useSubjects, useTasks, useMigration } from "@/hooks"
import { useDataSync } from "@/lib/data-sync"

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [studyTimeRange, setStudyTimeRange] = useState("weekly")
  const [testScoreRange, setTestScoreRange] = useState("weekly")
  const [selectedMonth, setSelectedMonth] = useState(new Date()) // Current month by default
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Current year by default
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [newSubjectName, setNewSubjectName] = useState("")
  
  // Safe localStorage utility
  const safeLocalStorage = {
    getItem: (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          return window.localStorage.getItem(key)
        } catch (error) {
          console.error('Error accessing localStorage:', error)
          return null
        }
      }
      return null
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(key, value)
        } catch (error) {
          console.error('Error setting localStorage:', error)
        }
      }
    }
  }
  
  // Use database hooks
  const {
    studySessions,
    loading: studySessionsLoading,
    error: studySessionsError
  } = useStudySessions()

  const {
    testMarks,
    loading: testMarksLoading,
    error: testMarksError
  } = useTestMarks()

  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
    createSubject
  } = useSubjects()

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError
  } = useTasks()

  const { autoMigrateIfNeeded } = useMigration()

  // Debug logging for all fetched data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Analytics Page Data Debug:', {
        studySessions: {
          count: studySessions?.length || 0,
          loading: studySessionsLoading,
          error: studySessionsError,
          sample: studySessions?.slice(0, 2) || []
        },
        testMarks: {
          count: testMarks?.length || 0,
          loading: testMarksLoading,
          error: testMarksError,
          sample: testMarks?.slice(0, 2) || []
        },
        subjects: {
          count: subjects?.length || 0,
          loading: subjectsLoading,
          error: subjectsError,
          sample: subjects?.slice(0, 2) || []
        },
        tasks: {
          count: tasks?.length || 0,
          loading: tasksLoading,
          error: tasksError,
          sample: tasks?.slice(0, 2) || [],
          rawTasks: tasks,
          tasksType: typeof tasks,
          isArray: Array.isArray(tasks)
        }
      })
      
      // Log the actual data structure
      console.log('📊 Raw Data Structure:', {
        studySessions: studySessions?.slice(0, 2).map(s => ({
          id: s.id,
          subjectId: s.subjectId,
          startTime: s.startTime,
          durationMinutes: s.durationMinutes,
          startTimeType: typeof s.startTime,
          startTimeValue: s.startTime
        })),
        subjects: subjects?.slice(0, 2).map(s => ({
          id: s.id,
          name: s.name,
          totalChapters: s.totalChapters,
          completedChapters: s.completedChapters
        }))
      })
    }
  }, [studySessions, testMarks, subjects, tasks, studySessionsLoading, testMarksLoading, subjectsLoading, tasksLoading, studySessionsError, testMarksError, subjectsError, tasksError])

  // Combine data from all hooks
  const realData = {
    studySessions: studySessions || [],
    testMarks: testMarks || [],
    subjects: subjects || [],
    tasks: tasks || []
  }
  
  // Debug: Log what's being received from hooks
  console.log('🔍 Analytics Page Hook Data:', {
    studySessions: {
      count: studySessions?.length || 0,
      loading: studySessionsLoading,
      error: studySessionsError,
      sample: studySessions?.slice(0, 2) || []
    },
    testMarks: {
      count: testMarks?.length || 0,
      loading: testMarksLoading,
      error: testMarksError,
      sample: testMarks?.slice(0, 2) || []
    },
    subjects: {
      count: subjects?.length || 0,
      loading: subjectsLoading,
      error: subjectsError,
      sample: subjects?.slice(0, 2) || []
    },
    tasks: {
      count: tasks?.length || 0,
      loading: tasksLoading,
      error: tasksError,
      sample: tasks?.slice(0, 2) || [],
      rawTasks: tasks,
      tasksType: typeof tasks,
      isArray: Array.isArray(tasks)
    }
  })

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

  // Function to create subjects dynamically from study sessions
  const createSubjectsFromSessions = (studySessions: any[], existingSubjects: any[]) => {
    // Don't auto-create subjects - let users add them manually
    return existingSubjects
  }

  // Function to manually add a new subject
  const addNewSubject = async () => {
    if (!newSubjectName.trim()) return
    
    const trimmedName = newSubjectName.trim()
    if (trimmedName.length > 50) return
    
    // Check if subject already exists (case-insensitive)
    const existingNames = realData.subjects.map(s => s.name.toLowerCase())
    if (existingNames.includes(trimmedName.toLowerCase())) {
      setNewSubjectName("")
      return
    }
    
    try {
      // Create subject using the database hook
      await createSubject({
      name: trimmedName,
      description: `Study sessions for ${trimmedName}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      progress: 0,
      totalChapters: 0,
      completedChapters: 0,
        credits: 3, // Default credits
        instructor: null, // Default null instructor
        nextExam: new Date(), // Default to today
        assignmentsDue: 0, // Default no assignments due
        code: null // Default null code
      })
      
      // Clear the input field
    setNewSubjectName("")
      
      // Show success message (you can add a toast notification here if needed)
      console.log(`Subject "${trimmedName}" created successfully!`)
    } catch (error) {
      console.error('Failed to create subject:', error)
      // You can add error handling here (e.g., show error message to user)
    }
  }

  // Simple authentication check
  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
  }, [status, router])

  // Auto-migrate data if needed
  useEffect(() => {
    if (status === "authenticated") {
      autoMigrateIfNeeded()
    }
  }, [status, autoMigrateIfNeeded])

  // Use global data synchronization system
  useDataSync('study-session-updated', () => {
    console.log('Study session updated, analytics page will refresh data...')
    // Force a re-render to get fresh data
    setStudyTimeRange(prev => prev)
  })

  useDataSync('subject-updated', () => {
    console.log('Subject updated, analytics page will refresh data...')
    // Force a re-render to get fresh data
    setSelectedSubject(prev => prev)
  })

  useDataSync('all-data-refresh', () => {
    console.log('All data refresh requested, analytics page will refresh...')
    // Force a complete refresh
    setStudyTimeRange(prev => prev)
    setSelectedSubject(prev => prev)
  })


  // Use subjects from database hooks - filter out any old hardcoded subjects
  const filteredSubjects = (subjects || []).filter(subject => {
    // Filter out any old hardcoded subjects that might still exist
    const hardcodedNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology']
    return !hardcodedNames.includes(subject.name)
  })



  // Generate dynamic study time data from real sessions
  const studyTimeData = useMemo(() => {
    console.log('🔍 StudyTimeData Debug:', {
      studyTimeRange,
      totalSessions: realData.studySessions.length,
      sessionsSample: realData.studySessions.slice(0, 3).map(s => ({
        id: s.id,
        subjectId: s.subjectId,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        startTimeType: typeof s.startTime,
        startTimeValue: s.startTime
      })),
      subjectsCount: subjects.length,
      subjectsSample: subjects.map(s => ({ id: s.id, name: s.name }))
    })
    
    if (realData.studySessions.length === 0) {
      console.log('❌ No study sessions found in realData')
      return []
    }
    
    const data: any[] = []
    
    if (studyTimeRange === "weekly") {
      // Weekly view - last 4 weeks
      const weeks = 4
    
    // Find the earliest and latest session dates to determine the time range
    const sessionDates = realData.studySessions.map(s => new Date(s.startTime)).filter(d => !isNaN(d.getTime()))
    
    if (sessionDates.length === 0) {
      console.log('❌ No valid session dates found')
      return []
    }
    
    const earliestDate = new Date(Math.min(...sessionDates.map(d => d.getTime())))
    const latestDate = new Date(Math.max(...sessionDates.map(d => d.getTime())))
    
    console.log('📅 Session Date Range:', {
      earliest: earliestDate.toISOString(),
      latest: latestDate.toISOString(),
      earliestFormatted: earliestDate.toDateString(),
      latestFormatted: latestDate.toDateString()
    })
    
    // Calculate weeks from the earliest session date
    const baseDate = new Date(earliestDate)
    baseDate.setDate(baseDate.getDate() - (baseDate.getDay() || 7)) // Start from Monday of that week
    
    for (let i = weeks - 1; i >= 0; i--) {
      // Calculate week boundaries from the base date
      const weekStart = new Date(baseDate)
      weekStart.setDate(baseDate.getDate() + (i * 7))
      weekStart.setHours(0, 0, 0, 0) // Start of day
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999) // End of day
      
      console.log(`📅 Week ${weeks - i}:`, {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekStartDate: weekStart.toDateString(),
        weekEndDate: weekEnd.toDateString()
      })
      
      const weekSessions = realData.studySessions.filter((session: any) => {
        try {
          // Handle both Date objects and ISO strings
          let sessionDate: Date
          if (session.startTime instanceof Date) {
            sessionDate = session.startTime
          } else if (typeof session.startTime === 'string') {
            sessionDate = new Date(session.startTime)
          } else {
            console.error(`❌ Invalid startTime format:`, session.startTime)
            return false
          }
          
          // Check if date is valid
          if (isNaN(sessionDate.getTime())) {
            console.error(`❌ Invalid date parsed:`, session.startTime, sessionDate)
            return false
          }
          
          const isInWeek = sessionDate >= weekStart && sessionDate <= weekEnd
          
          return isInWeek
        } catch (error) {
          console.error(`❌ Error parsing session date:`, session.startTime, error)
          return false
        }
      })
      
      console.log(`📈 Week ${weeks - i} sessions:`, weekSessions.length)
      
      const weekData: any = { date: `Week ${weeks - i}` }
      
      if (subjects.length > 0) {
        subjects.forEach(subject => {
          const subjectSessions = weekSessions.filter((s: any) => s.subjectId === subject.id)
          const totalHours = subjectSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
          weekData[subject.name] = Math.round(totalHours * 10) / 10
        })
      } else {
        // If no subjects, show total study time
        const totalHours = weekSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
        weekData.totalHours = Math.round(totalHours * 10) / 10
      }
      
      data.push(weekData)
      }
         } else if (studyTimeRange === "monthly") {
       // Monthly view - selected month with each day
       const selectedMonthDate = startOfDay(selectedMonth)
       const currentMonth = selectedMonthDate.getMonth()
       const currentYear = selectedMonthDate.getFullYear()
       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
       
       console.log('📅 Monthly View for Study Time:', {
         month: selectedMonthDate.toLocaleDateString('en-US', { month: 'long' }),
         year: currentYear,
         daysInMonth: daysInMonth,
         selectedDate: selectedMonthDate.toISOString()
       })
       
       for (let day = 1; day <= daysInMonth; day++) {
         const dayDate = new Date(currentYear, currentMonth, day)
         dayDate.setHours(0, 0, 0, 0) // Start of day
         
         const dayEnd = new Date(dayDate)
         dayEnd.setHours(23, 59, 59, 999) // End of day
         
         const daySessions = realData.studySessions.filter((session: any) => {
           try {
             let sessionDate: Date
             if (session.startTime instanceof Date) {
               sessionDate = session.startTime
             } else if (typeof session.startTime === 'string') {
               sessionDate = new Date(session.startTime)
             } else {
               return false
             }
             
             if (isNaN(sessionDate.getTime())) {
               return false
             }
             
             // Check if session is from selected month and specific day
             return sessionDate.getMonth() === currentMonth && 
                    sessionDate.getFullYear() === currentYear && 
                    sessionDate.getDate() === day
           } catch (error) {
             return false
           }
         })
         
         const dayData: any = { 
           date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
         }
         
         if (subjects.length > 0) {
           subjects.forEach(subject => {
             const subjectSessions = daySessions.filter((s: any) => s.subjectId === subject.id)
             const totalHours = subjectSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
             dayData[subject.name] = Math.round(totalHours * 10) / 10
           })
         } else {
           const totalHours = daySessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
           dayData.totalHours = Math.round(totalHours * 10) / 10
         }
         
         data.push(dayData)
       }
    } else if (studyTimeRange === "yearly") {
      // Yearly view - all 12 months of the selected year
      const yearToProcess = selectedYear
      
      console.log(`📅 Processing year for study time:`, {
        year: yearToProcess
      })
      
      // Generate data for each month of the selected year
      for (let month = 0; month < 12; month++) {
        const monthStart = startOfMonth(new Date(yearToProcess, month, 1))
        const monthEnd = endOfMonth(new Date(yearToProcess, month, 1))
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' })
        
        const monthSessions = realData.studySessions.filter((session: any) => {
          try {
            let sessionDate: Date
            if (session.startTime instanceof Date) {
              sessionDate = session.startTime
            } else if (typeof session.startTime === 'string') {
              sessionDate = new Date(session.startTime)
            } else {
              return false
            }
            
            if (isNaN(sessionDate.getTime())) {
              return false
            }
            
            const isInMonth = sessionDate >= monthStart && sessionDate < monthEnd
            return isInMonth
          } catch (error) {
            return false
          }
        })
        
        const monthData: any = { date: monthName }
        
        if (subjects.length > 0) {
          subjects.forEach(subject => {
            const subjectSessions = monthSessions.filter((s: any) => s.subjectId === subject.id)
            const totalHours = subjectSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
            monthData[subject.name] = Math.round(totalHours * 10) / 10
          })
        } else {
          const totalHours = monthSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) / 60
          monthData.totalHours = Math.round(totalHours * 10) / 10
        }
        
        data.push(monthData)
      }
    }
    
    console.log('📊 Final studyTimeData:', data)
    return data
  }, [realData.studySessions, subjects, studyTimeRange, selectedMonth, selectedYear])

  // Generate dynamic test scores data from real test marks
  const testScoresData = useMemo(() => {
    console.log('🔍 Test Scores Data Generation:', {
      testScoreRange,
        testMarksCount: realData.testMarks.length,
        subjectsCount: subjects.length,
      testMarksRaw: realData.testMarks,
      subjectsRaw: subjects,
      testMarksLoading,
      testMarksError
    })
    
    if (realData.testMarks.length === 0 || subjects.length === 0) {
      console.log('❌ No test marks or subjects available for test scores data')
      return []
    }
    
    const data: any[] = []
    
    if (testScoreRange === "weekly") {
      // Weekly view - current week with each day
      const today = startOfDay(new Date())
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Sunday
      
      console.log(`📅 Processing current week:`, {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        today: today.toISOString()
      })
      
      // Generate data for each day of the current week
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(weekStart, i)
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' })
        
        const dayTests = realData.testMarks.filter((test: any) => {
          const testDate = startOfDay(new Date(test.testDate))
          const isSameDay = testDate.getDate() === dayDate.getDate() && 
                           testDate.getMonth() === dayDate.getMonth() && 
                           testDate.getFullYear() === dayDate.getFullYear()
          
          return isSameDay
        })
        
        const dayData: any = { date: dayName }
        
        subjects.forEach(subject => {
          const subjectTests = dayTests.filter((t: any) => t.subjectId === subject.id)
          
          if (subjectTests.length > 0) {
            const avgScore = subjectTests.reduce((sum: number, t: any) => {
              const percentage = (t.score / t.maxScore) * 100
              console.log(`📊 Day ${dayName} - Subject ${subject.name}: score=${t.score}, maxScore=${t.maxScore}, percentage=${percentage}`)
              return sum + percentage
            }, 0) / subjectTests.length
            dayData[subject.name] = Math.round(avgScore)
          } else {
            dayData[subject.name] = 0
          }
        })
        
        data.push(dayData)
      }
             } else if (testScoreRange === "monthly") {
      // Monthly view - selected month with each day
      const selectedMonthDate = startOfDay(selectedMonth)
      const currentMonth = selectedMonthDate.getMonth()
      const currentYear = selectedMonthDate.getFullYear()
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      
      console.log(`📅 Processing selected month:`, {
        month: selectedMonthDate.toLocaleDateString('en-US', { month: 'long' }),
        year: currentYear,
        daysInMonth: daysInMonth,
        selectedDate: selectedMonthDate.toISOString()
      })
      
      // Generate data for each day of the selected month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day)
        const dayName = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        const dayTests = realData.testMarks.filter((test: any) => {
          const testDate = startOfDay(new Date(test.testDate))
          const isSameDay = testDate.getDate() === dayDate.getDate() && 
                           testDate.getMonth() === dayDate.getMonth() && 
                           testDate.getFullYear() === dayDate.getFullYear()
          
          return isSameDay
        })
        
        const dayData: any = { date: dayName }
        
        subjects.forEach(subject => {
          const subjectTests = dayTests.filter((t: any) => t.subjectId === subject.id)
          
          if (subjectTests.length > 0) {
            const avgScore = subjectTests.reduce((sum: number, t: any) => {
              const percentage = (t.score / t.maxScore) * 100
              console.log(`📊 Day ${dayName} - Subject ${subject.name}: score=${t.score}, maxScore=${t.maxScore}, percentage=${percentage}`)
              return sum + percentage
            }, 0) / subjectTests.length
            dayData[subject.name] = Math.round(avgScore)
          } else {
            dayData[subject.name] = 0
          }
        })
        
        data.push(dayData)
      }
    } else if (testScoreRange === "yearly") {
      // Yearly view - all 12 months of the selected year
      const yearToProcess = selectedYear
      
      console.log(`📅 Processing year:`, {
        year: yearToProcess
      })
      
      // Generate data for each month of the selected year
      for (let month = 0; month < 12; month++) {
        const monthStart = startOfMonth(new Date(yearToProcess, month, 1))
        const monthEnd = endOfMonth(new Date(yearToProcess, month, 1))
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' })
      
      const monthTests = realData.testMarks.filter((test: any) => {
          const testDate = startOfDay(new Date(test.testDate))
          const isInMonth = testDate >= monthStart && testDate < monthEnd
          
          return isInMonth
        })
        
        const monthData: any = { date: monthName }
      
      subjects.forEach(subject => {
        const subjectTests = monthTests.filter((t: any) => t.subjectId === subject.id)
        
        if (subjectTests.length > 0) {
          const avgScore = subjectTests.reduce((sum: number, t: any) => {
              const percentage = (t.score / t.maxScore) * 100
              console.log(`📊 Month ${monthName} - Subject ${subject.name}: score=${t.score}, maxScore=${t.maxScore}, percentage=${percentage}`)
              return sum + percentage
          }, 0) / subjectTests.length
          monthData[subject.name] = Math.round(avgScore)
        } else {
          monthData[subject.name] = 0
        }
      })
      
      data.push(monthData)
      }
    }
    
    console.log('📊 Final testScoresData:', data)
    return data
  }, [realData.testMarks, subjects, testScoreRange, selectedMonth, selectedYear])

  // Generate dynamic subject progress data from real sessions and chapter progress
  const subjectProgressData = useMemo(() => {
    console.log('🔍 Subject Progress Data Debug:', {
      totalSubjects: subjects.length,
      totalSessions: realData.studySessions.length,
      subjectsSample: subjects.map(s => ({
        id: s.id,
        name: s.name,
        totalChapters: s.totalChapters,
        completedChapters: s.completedChapters
      })),
      sessionsSample: realData.studySessions.slice(0, 3).map(s => ({
        id: s.id,
        subjectId: s.subjectId,
        durationMinutes: s.durationMinutes
      }))
    })
    
    return subjects.map(subject => {
      const subjectSessions = realData.studySessions.filter((s: any) => s.subjectId === subject.id)
      const studyTime = subjectSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0)
      
      // Calculate progress based on chapter completion, not study sessions
      const totalChapters = subject.totalChapters || 0
      const completedChapters = subject.completedChapters || 0
      const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
      
      console.log(`📚 Subject ${subject.name} Progress:`, {
        subjectId: subject.id,
        sessions: subjectSessions.length,
        studyTimeMinutes: studyTime,
        studyTimeFormatted: convertMinutesToHoursAndMinutes(studyTime),
        totalChapters,
        completedChapters,
        progressPercentage,
        sessionIds: subjectSessions.map(s => s.id)
      })
      
      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        progress: progressPercentage, // Based on chapter completion
        studyTime: convertMinutesToHoursAndMinutes(studyTime),
        sessions: subjectSessions.length,
        chapters: totalChapters,
        completedChapters: completedChapters
      }
    })
  }, [subjects, realData.studySessions, convertMinutesToHoursAndMinutes])

  // Generate dynamic goal achievement data from real data
  const goalAchievementData = useMemo(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - today.getDay())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Load user's actual study goals from settings or use defaults
    let dailyGoalMinutes = 2 * 60 // Default: 2 hours per day
    let weeklyGoalMinutes = 10 * 60 // Default: 10 hours per week
    let monthlyGoalMinutes = 40 * 60 // Default: 40 hours per month
    
    // Only access localStorage on the client side
    try {
      const savedSettings = safeLocalStorage.getItem("userSettings")
      console.log('Raw saved settings from localStorage:', savedSettings)
      if (savedSettings) {
        const userSettings = JSON.parse(savedSettings)
        console.log('Parsed user settings:', userSettings)
        if (userSettings.studyGoals) {
          console.log('Study goals found:', userSettings.studyGoals)
          dailyGoalMinutes = userSettings.studyGoals.dailyHours * 60
          
          // Check if autoCalculate is enabled
          if (userSettings.studyGoals.autoCalculate) {
            // Auto-calculate weekly and monthly from daily goal
            weeklyGoalMinutes = userSettings.studyGoals.dailyHours * 7 * 60  // daily × 7 days
            monthlyGoalMinutes = userSettings.studyGoals.dailyHours * 30 * 60 // daily × 30 days
            console.log('Auto-calculated goals:', {
              daily: userSettings.studyGoals.dailyHours,
              weekly: userSettings.studyGoals.dailyHours * 7,
              monthly: userSettings.studyGoals.dailyHours * 30
            })
          } else {
            // Use manual values
            weeklyGoalMinutes = userSettings.studyGoals.weeklyHours * 60
            monthlyGoalMinutes = userSettings.studyGoals.monthlyHours * 60
            console.log('Manual goals:', {
              daily: userSettings.studyGoals.dailyHours,
              weekly: userSettings.studyGoals.weeklyHours,
              monthly: userSettings.studyGoals.monthlyHours
            })
          }
          
          // Debug logging for goal settings
          if (process.env.NODE_ENV === 'development') {
            console.log('Goal Settings Debug:', {
              dailyHours: userSettings.studyGoals.dailyHours,
              weeklyHours: userSettings.studyGoals.autoCalculate ? userSettings.studyGoals.dailyHours * 7 : userSettings.studyGoals.weeklyHours,
              monthlyHours: userSettings.studyGoals.autoCalculate ? userSettings.studyGoals.dailyHours * 30 : userSettings.studyGoals.monthlyHours,
              autoCalculate: userSettings.studyGoals.autoCalculate,
              dailyGoalMinutes,
              weeklyGoalMinutes,
              monthlyGoalMinutes
            })
          }
        }
      } else {
        // Debug logging when no settings found
        if (process.env.NODE_ENV === 'development') {
          console.log('No user settings found, using defaults:', {
            dailyGoalMinutes,
            weeklyGoalMinutes,
            monthlyGoalMinutes
          })
        }
      }
    } catch (error) {
      console.error("Failed to parse user settings:", error)
    }
    
    // Daily goals - based on today's study sessions
    const todaySessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.startTime)
      return sessionDate.toDateString() === today.toDateString()
    })
    const dailyStudyTime = todaySessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) // Use durationMinutes instead of duration
    const dailyAchievement = Math.min(100, (dailyStudyTime / dailyGoalMinutes) * 100)
    
    // Weekly goals - based on this week's study sessions
    const weekSessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.startTime)
      return sessionDate >= weekStart && sessionDate <= today
    })
    const weeklyStudyTime = weekSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) // Use durationMinutes instead of duration
    const weeklyAchievement = Math.min(100, (weeklyStudyTime / weeklyGoalMinutes) * 100)
    
    // Monthly goals - based on this month's study sessions
    const monthSessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.startTime)
      return sessionDate >= monthStart && sessionDate <= today
    })
    const monthlyStudyTime = monthSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) // Use durationMinutes instead of duration
    const monthlyAchievement = Math.min(100, (monthlyStudyTime / monthlyGoalMinutes) * 100)
    
    // Debug logging for goal achievements
    if (process.env.NODE_ENV === 'development') {
      console.log('Goal Achievement Debug:', {
        dailyStudyTime,
        dailyGoalMinutes,
        dailyAchievement,
        weeklyStudyTime,
        weeklyGoalMinutes,
        weeklyAchievement,
        monthlyStudyTime,
        monthlyGoalMinutes,
        monthlyAchievement
      })
    }
    
    const result = [
      { 
        name: "Daily Goals", 
        achieved: Math.round(dailyAchievement), 
        total: 100,
        actual: dailyStudyTime,
        target: dailyGoalMinutes,
        unit: "minutes"
      },
      { 
        name: "Weekly Goals", 
        achieved: Math.round(weeklyAchievement), 
        total: 100,
        actual: weeklyStudyTime,
        target: weeklyGoalMinutes,
        unit: "minutes"
      },
      { 
        name: "Monthly Goals", 
        achieved: Math.round(monthlyAchievement), 
        total: 100,
        actual: monthlyStudyTime,
        target: monthlyGoalMinutes,
        unit: "minutes"
      },
    ]
    
    // Debug logging for final goal achievement data
    if (process.env.NODE_ENV === 'development') {
      console.log('Final Goal Achievement Data:', result)
    }
    
    return result
  }, [realData.studySessions])

  // Generate dynamic study distribution data from real sessions
  const studyDistribution = useMemo(() => {
    // Debug logging for subjects and study sessions
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Study Distribution Debug:', {
        subjectsCount: subjects.length,
        subjects: subjects.map(s => ({ id: s.id, name: s.name, color: s.color })),
        studySessionsCount: realData.studySessions.length,
        studySessionsSample: realData.studySessions.slice(0, 3).map(s => ({
          id: s.id,
          subjectId: s.subjectId,
          durationMinutes: s.durationMinutes
        }))
      })
    }

    if (subjects.length === 0) {
      // If no subjects, group all sessions as "General Study"
      const generalSessions = realData.studySessions.filter((s: any) => !s.subjectId)
      const generalStudyTime = generalSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0)
      
      return [{
        name: "General Study",
        color: "#6b7280",
        value: Math.round((generalStudyTime / 60) * 10) / 10, // Convert to hours for chart
        studyTime: convertMinutesToHoursAndMinutes(generalStudyTime),
        sessions: generalSessions.length,
        avgSessionLength: generalSessions.length > 0
          ? Math.round((generalStudyTime / generalSessions.length / 60) * 10) / 10
          : 0
      }]
    }

    return subjects.map((subject, index) => {
      const subjectSessions = realData.studySessions.filter((s: any) => s.subjectId === subject.id)
      const totalStudyTime = subjectSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0)
      
      // Debug logging for subject study time calculation
      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 Subject Study Time: ${subject.name}`, {
          subjectId: subject.id,
          subjectName: subject.name,
          sessionsCount: subjectSessions.length,
          totalMinutes: totalStudyTime,
          totalHours: Math.round((totalStudyTime / 60) * 10) / 10
        })
      }
      
      // Use predefined colors array for consistent coloring across charts
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
      const subjectColor = colors[index % colors.length]
      
      return {
        name: subject.name,
        color: subjectColor, // Assign distinct color to each subject
        value: Math.round((totalStudyTime / 60) * 10) / 10, // Convert to hours for chart
        studyTime: convertMinutesToHoursAndMinutes(totalStudyTime),
        sessions: subjectSessions.length,
        avgSessionLength: subjectSessions.length > 0
          ? Math.round((totalStudyTime / subjectSessions.length / 60) * 10) / 10
          : 0
      }
    })
  }, [subjects, realData.studySessions])

  // Calculate total study time from real data
  const totalStudyTime = useMemo(() => {
    return realData.studySessions.reduce((sum: number, session: any) => {
      return sum + (session.durationMinutes || 0)
    }, 0)
  }, [realData.studySessions])

  // Calculate average test score from real data
  const averageTestScore = useMemo(() => {
    if (realData.testMarks.length === 0) return 0
    
    // Debug logging for test marks
    if (process.env.NODE_ENV === 'development') {
      console.log('Test Marks Debug:', {
        testMarksCount: realData.testMarks.length,
        testMarksSample: realData.testMarks.slice(0, 3).map(t => ({
          id: t.id,
          marksObtained: t.score,
          totalMarks: t.maxScore,
          percentage: (t.score / t.maxScore) * 100,
          subjectName: `Subject ${t.subjectId}` // Using subjectId since subjectName doesn't exist
        }))
      })
    }
    
    const totalScore = realData.testMarks.reduce((sum: number, test: any) => {
      // Calculate percentage from score and maxScore (database fields)
      const marksObtained = Number(test.score) || 0
      const totalMarks = Number(test.maxScore) || 1
      
      if (totalMarks > 0) {
        const percentage = (marksObtained / totalMarks) * 100
        console.log(`📊 Test Score: ${marksObtained}/${totalMarks} = ${percentage}%`)
        return sum + percentage
      }
      return sum
    }, 0)
    
    const result = Math.round(totalScore / realData.testMarks.length)
    
    // Debug logging for calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('Average Test Score Calculation:', {
        totalScore,
        testMarksCount: realData.testMarks.length,
        averageTestScore: result
      })
    }
    
    return result
  }, [realData.testMarks])

  // Calculate completed and total chapters from real data
  const completedTopics = useMemo(() => {
    return subjects.reduce((sum, subject) => sum + (subject.completedChapters || 0), 0)
  }, [subjects])

  const totalTopics = useMemo(() => {
    return subjects.reduce((sum, subject) => sum + (subject.totalChapters || 0), 0)
  }, [subjects])

  if (status === "loading" || studySessionsLoading || testMarksLoading || subjectsLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
          <div className="mt-2 text-sm text-muted-foreground">
            {studySessionsLoading && <div>Loading study sessions...</div>}
            {testMarksLoading && <div>Loading test marks...</div>}
            {subjectsLoading && <div>Loading subjects...</div>}
            {tasksLoading && <div>Loading tasks...</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Analytics</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Display */}
        {(studySessionsError || testMarksError || subjectsError || tasksError) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">Data Loading Errors</h3>
            <div className="space-y-2 text-sm">
              {studySessionsError && (
                <div className="text-destructive">Study Sessions: {studySessionsError}</div>
              )}
              {testMarksError && (
                <div className="text-destructive">Test Marks: {testMarksError}</div>
              )}
              {subjectsError && (
                <div className="text-destructive">Subjects: {subjectsError}</div>
              )}
              {tasksError && (
                <div className="text-destructive">Tasks: {tasksError}</div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Analytics Component */}
        <AdvancedAnalytics data={realData} />
        
        {/* Original Analytics Content */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Progress Analytics</h1>
            <p className="text-muted-foreground">Track your academic progress and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={studyTimeRange} onValueChange={setStudyTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Subject Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <Badge
                      key={subject.id}
                      variant="outline"
                      className="px-3 py-1"
                      style={{ borderColor: subject.color, color: subject.color }}
                    >
                      {subject.name}
                    </Badge>
                  ))
                ) : (
                  <div className="text-center w-full py-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No subjects added yet</p>
                    <p className="text-xs text-muted-foreground">
                      Add subjects to organize your study sessions and get detailed analytics
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add new subject (e.g., Mathematics, Physics)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewSubject()}
                  className="flex-1"
                  maxLength={50}
                />
                <Button
                  onClick={addNewSubject}
                  disabled={!newSubjectName.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Subjects help organize your study sessions and provide detailed analytics. 
                Start by adding your main study subjects (e.g., Mathematics, Physics, Chemistry).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {realData.studySessions.length === 0 && realData.tasks.length === 0 && realData.testMarks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                Start studying and creating tasks to see your analytics here.
                {subjects.length === 0 && (
                  <span className="block mt-2 text-sm">
                    💡 Add subjects to get detailed analytics and better organization of your study data.
                  </span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button>
                    Go to Dashboard
                  </Button>
                </Link>
                {subjects.length === 0 && (
                  <Link href="/subjects">
                                          <Button variant="outline">
                        Add Your First Subject
                      </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Subjects Warning (when there's data but no subjects) */}
        {(realData.studySessions.length > 0 || realData.tasks.length > 0 || realData.testMarks.length > 0) && subjects.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 dark:text-blue-400">
                  🎯
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Ready to Organize Your Studies?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You have study data! Adding subjects will help you organize your sessions and get detailed analytics. 
                    Create subjects like "Mathematics", "Physics", or "Literature" to start organizing your studies.
                  </p>
                  <div className="mt-3">
                    <Link href="/subjects">
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800/20">
                        Add Your First Subject
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Study Hours</p>
                  <p className="text-2xl font-bold">{convertMinutesToHoursAndMinutes(totalStudyTime)}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {realData.studySessions.length > 0 ? `${realData.studySessions.length} sessions` : 'No sessions yet'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Test Score</p>
                  <p className="text-2xl font-bold">{averageTestScore}%</p>
                </div>
                <Award className="h-8 w-8 text-accent" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {realData.testMarks.length > 0 ? `${realData.testMarks.length} tests taken` : 'No tests yet'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chapters Completed</p>
                  <p className="text-2xl font-bold">
                    {completedTopics}/{totalTopics}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-chart-1" />
              </div>
              <div className="mt-2">
                <Progress value={totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTopics} of {totalTopics} chapters completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Goal Achievement</p>
                    <div className="relative group">
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Calculated based on study time goals from your settings and actual study sessions completed
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    {goalAchievementData.length > 0 ? Math.round(goalAchievementData.reduce((sum, goal) => sum + goal.achieved, 0) / goalAchievementData.length) : 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-chart-2" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {goalAchievementData.length > 0 && goalAchievementData.reduce((sum, goal) => sum + goal.achieved, 0) / goalAchievementData.length >= 80 ? 'On track' : 'Needs improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        {realData.studySessions.length > 0 || realData.tasks.length > 0 || realData.testMarks.length > 0 ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="study-time">Study Time</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectProgressData.length > 0 ? (
                  <div className="space-y-4">
                    {subjectProgressData.map((subject) => (
                      <div key={subject.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{subject.name}</span>
                          <span className="text-sm text-muted-foreground">
                              {subject.progress}% complete
                          </span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{subject.sessions} sessions</span>
                            <span>{subject.studyTime} studied</span>
                            <span>{subject.chapters} chapters</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No subjects added yet</p>
                        <p className="text-xs mt-1">Add subjects to see detailed progress</p>
                      </div>
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Study Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Study Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    {studyDistribution.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={studyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {studyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            `${value}h (${Math.round((value / studyDistribution.reduce((sum: number, item: any) => sum + item.value, 0)) * 100)}%)`,
                            name
                          ]}
                        />
                      <Legend />
                      
                      {/* Subject Colors Legend */}
                      <div className="mt-4 flex flex-wrap justify-center gap-3">
                        {studyDistribution.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
                              {entry.name}: {entry.studyTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </PieChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Clock className="h-12 w-12 mx-auto mb-2" />
                          <p>No study time data available</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="study-time" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Study Hours</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={studyTimeRange === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStudyTimeRange("weekly")}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={studyTimeRange === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStudyTimeRange("monthly")}
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={studyTimeRange === "yearly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStudyTimeRange("yearly")}
                    >
                      Yearly
                    </Button>
                    
                    {/* Month Navigation (only show when monthly view is selected) */}
                    {studyTimeRange === "monthly" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
                        >
                          ←
                        </Button>
                        <span className="text-sm font-medium min-w-[80px] text-center">
                          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                        >
                          →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(new Date())}
                        >
                          Today
                        </Button>
                      </div>
                    )}
                    
                    {/* Year Navigation (only show when yearly view is selected) */}
                    {studyTimeRange === "yearly" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(selectedYear - 1)}
                        >
                          ←
                        </Button>
                        <span className="text-sm font-medium min-w-[60px] text-center">
                          {selectedYear}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(selectedYear + 1)}
                        >
                          →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(new Date().getFullYear())}
                        >
                          Current
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    {studyTimeData.length > 0 ? (
                  <BarChart data={studyTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value}h`, name]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                        {subjects.length > 0 ? subjects.map((subject, index) => {
                          // Generate a unique color for each subject - force different colors
                          const colors = [
                            '#3b82f6', // Blue
                            '#ef4444', // Red
                            '#10b981', // Green
                            '#f59e0b', // Yellow
                            '#8b5cf6', // Purple
                            '#06b6d4', // Cyan
                            '#f97316', // Orange
                            '#ec4899', // Pink
                            '#84cc16', // Lime
                            '#6366f1'  // Indigo
                          ]
                          const subjectColor = colors[index % colors.length]
                          console.log(`🎨 Subject ${subject.name} color:`, subjectColor, 'index:', index)
                          
                          return (
                          <Bar 
                            key={subject.name}
                            dataKey={subject.name} 
                              fill={subjectColor}
                              radius={[4, 4, 0, 0]}
                          />
                          )
                        }) : (
                          <Bar dataKey="totalHours" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        )}
                  </BarChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-2" />
                          <p>No study data available for this period</p>
                        </div>
                      </div>
                    )}
                </ResponsiveContainer>
                
                {/* Subject Color Legend */}
                {subjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <h5 className="text-sm font-medium text-muted-foreground mb-3">Subject Colors:</h5>
                    <div className="flex flex-wrap gap-3">
                      {subjects.map((subject, index) => {
                        const colors = [
                          '#3b82f6', // Blue
                          '#ef4444', // Red
                          '#10b981', // Green
                          '#f59e0b', // Yellow
                          '#8b5cf6', // Purple
                          '#06b6d4', // Cyan
                          '#f97316', // Orange
                          '#ec4899', // Pink
                          '#84cc16', // Lime
                          '#6366f1'  // Indigo
                        ]
                        const subjectColor = colors[index % colors.length]
                        return (
                          <div key={subject.id} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: subjectColor }}
                            ></div>
                            <span className="text-xs text-muted-foreground">{subject.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle>Test Score Trends</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={testScoreRange === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestScoreRange("weekly")}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={testScoreRange === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestScoreRange("monthly")}
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={testScoreRange === "yearly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestScoreRange("yearly")}
                    >
                      Yearly
                    </Button>
                    
                    {/* Month Navigation (only show when monthly view is selected) */}
                    {testScoreRange === "monthly" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
                        >
                          ←
                        </Button>
                        <span className="text-sm font-medium min-w-[80px] text-center">
                          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                        >
                          →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(new Date())}
                        >
                          Today
                        </Button>
                      </div>
                    )}
                    
                    {/* Year Navigation (only show when yearly view is selected) */}
                    {testScoreRange === "yearly" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(selectedYear - 1)}
                        >
                          ←
                        </Button>
                        <span className="text-sm font-medium min-w-[60px] text-center">
                          {selectedYear}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(selectedYear + 1)}
                        >
                          →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedYear(new Date().getFullYear())}
                        >
                          Current
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    {testScoresData.length > 0 ? (
                  <LineChart data={testScoresData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                        {subjects.length > 0 ? subjects.map((subject, index) => {
                          // Generate a unique color for each subject - same colors as study sessions
                          const colors = [
                            '#3b82f6', // Blue
                            '#ef4444', // Red
                            '#10b981', // Green
                            '#f59e0b', // Yellow
                            '#8b5cf6', // Purple
                            '#06b6d4', // Cyan
                            '#f97316', // Orange
                            '#ec4899', // Pink
                            '#84cc16', // Lime
                            '#6366f1'  // Indigo
                          ]
                          const subjectColor = colors[index % colors.length]
                          
                          return (
                          <Line 
                            key={subject.name}
                            type="monotone" 
                            dataKey={subject.name} 
                              stroke={subjectColor}
                              strokeWidth={3}
                              dot={{ fill: subjectColor, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: subjectColor, strokeWidth: 2 }}
                            />
                          )
                        }) : (
                          <Line 
                            type="monotone" 
                            dataKey="averageScore" 
                            stroke="#0ea5e9" 
                            strokeWidth={2} 
                          />
                        )}
                  </LineChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Award className="h-12 w-12 mx-auto mb-2" />
                          <p>No test data available for this period</p>
                        </div>
                      </div>
                    )}
                </ResponsiveContainer>
                
                {/* Subject Color Legend */}
                {subjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <h5 className="text-sm font-medium text-muted-foreground mb-3">Subject Colors:</h5>
                    <div className="flex flex-wrap gap-3">
                      {subjects.map((subject, index) => {
                        const colors = [
                          '#3b82f6', // Blue
                          '#ef4444', // Red
                          '#10b981', // Green
                          '#f59e0b', // Yellow
                          '#8b5cf6', // Purple
                          '#06b6d4', // Cyan
                          '#f97316', // Orange
                          '#ec4899', // Pink
                          '#84cc16', // Lime
                          '#6366f1'  // Indigo
                        ]
                        const subjectColor = colors[index % colors.length]
                        return (
                          <div key={subject.id} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: subjectColor }}
                            ></div>
                            <span className="text-xs text-muted-foreground">{subject.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goalAchievementData.map((goal) => (
                <Card key={goal.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{goal.achieved}%</span>
                        <Badge variant={goal.achieved >= 80 ? "default" : "secondary"}>
                          {goal.achieved >= 80 ? "Excellent" : "Needs Improvement"}
                        </Badge>
                      </div>
                      <Progress value={goal.achieved} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {convertMinutesToHoursAndMinutes(goal.actual)}/{convertMinutesToHoursAndMinutes(goal.target)} achieved
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        ) : null}
      </div>
    </div>
  )
}
