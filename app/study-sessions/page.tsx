"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Clock, Search, Plus, ArrowLeft, Calendar, BookOpen, Target, TrendingUp, 
  Edit, Trash2, Timer, BarChart3, Filter, SortAsc, SortDesc, Eye, EyeOff,
  Play, Pause, Square, RotateCcw, Zap, Bookmark, Star, CheckCircle, Info
} from "lucide-react"
import { AddSessionDialog } from "@/components/study-sessions/add-session-dialog"
import { EditSessionDialog } from "@/components/study-sessions/edit-session-dialog"
import { DeleteSessionDialog } from "@/components/study-sessions/delete-session-dialog"

import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useStudySessions, useSubjects, useMigration, useTestMarks } from "@/hooks"
import { StudySession, Subject, TestMark } from "@prisma/client"
import { notifyDataUpdate } from "@/lib/data-sync"
import React from "react"

export default function StudySessionsPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedSessionType, setSelectedSessionType] = useState<string>("all")
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
  })
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const router = useRouter()

  // Calculate efficiency based on study metrics instead of arbitrary calculation
  const calculateEfficiency = (sessionData: {
    subjectId: string
    duration: number
    productivity: number
    topicsCovered: string[]
    materialsUsed: string[]
    notes?: string
  }) => {
    console.log('🔍 calculateEfficiency called with:', sessionData)
    
    // Topics Score (40% weight) - 0-5 points
    let topicsScore = 0
    if (sessionData.topicsCovered.length === 0) topicsScore = 0
    else if (sessionData.topicsCovered.length <= 2) topicsScore = 2
    else if (sessionData.topicsCovered.length <= 4) topicsScore = 4
    else topicsScore = 5

    // Materials Score (30% weight) - 0-3 points
    let materialsScore = 0
    if (sessionData.materialsUsed.length === 0) materialsScore = 0
    else if (sessionData.materialsUsed.length === 1) materialsScore = 1.5
    else materialsScore = 3

    // Duration Score (20% weight) - 0-2.5 points
    let durationScore = 0
    if (sessionData.duration < 30) durationScore = 1
    else if (sessionData.duration <= 60) durationScore = 1.5
    else if (sessionData.duration <= 120) durationScore = 2
    else durationScore = 2.5

    // Productivity Score (10% weight) - 0-1 point
    const productivityScore = (sessionData.productivity - 1) * 0.25 // Convert 1-5 to 0-1

    console.log('🔍 Efficiency calculation breakdown:', {
      topicsCovered: sessionData.topicsCovered.length,
      topicsScore,
      materialsUsed: sessionData.materialsUsed.length,
      materialsScore,
      duration: sessionData.duration,
      durationScore,
      productivity: sessionData.productivity,
      productivityScore,
      // Add detailed calculation breakdown
      topicsWeighted: topicsScore * 0.4,
      materialsWeighted: materialsScore * 0.3,
      durationWeighted: durationScore * 0.2,
      productivityWeighted: productivityScore * 0.1
    })

    // Calculate weighted efficiency (this gives us a score out of 3.5 total possible points)
    const weightedSum = (topicsScore * 0.4) + (materialsScore * 0.3) + (durationScore * 0.2) + (productivityScore * 0.1)
    
    // Convert to 0-10 scale: (weightedSum / 3.5) * 10
    // 3.5 is the maximum possible weighted sum: (5*0.4) + (3*0.3) + (2.5*0.2) + (1*0.1) = 2 + 0.9 + 0.5 + 0.1 = 3.5
    const efficiency = Math.round((weightedSum / 3.5) * 10)
    
    const finalEfficiency = Math.max(0, Math.min(10, efficiency))
    
    console.log('🔍 Final efficiency calculation:', {
      weightedSum,
      maxPossibleSum: 3.5,
      scaledTo10: (weightedSum / 3.5) * 10,
      rounded: efficiency,
      final: finalEfficiency
    })

    return finalEfficiency
  }

  // Test the efficiency calculation with your specific data
  React.useEffect(() => {
    // Test with your exact session data
    const testEfficiency = calculateEfficiency({
      subjectId: "test",
      duration: 390, // 6h 30m
      productivity: 5,
      topicsCovered: ["dsadasd", "asdasdas", "sadasdas", "dasdasdas", "sadasdasd"],
      materialsUsed: ["dasdsaddasdasd", "dasdasda", "safweqed", "dasfdasfewqdw", "fdasfdsfds"],
      notes: "test"
    })
    console.log('🔍 TEST: Expected efficiency for your session should be 10, got:', testEfficiency)
    
    // Manual calculation verification
    const topicsScore = 5 // 5 topics = 5 points
    const materialsScore = 3 // 5+ materials = 3 points  
    const durationScore = 2.5 // 390 minutes = 2.5 points
    const productivityScore = (5 - 1) * 0.25 // 5 productivity = 1 point
    
    const weightedSum = (topicsScore * 0.4) + (materialsScore * 0.3) + (durationScore * 0.2) + (productivityScore * 0.1)
    const expectedEfficiency = Math.round((weightedSum / 3.5) * 10)
    
    console.log('🔍 MANUAL CALCULATION VERIFICATION:', {
      topicsScore,
      materialsScore, 
      durationScore,
      productivityScore,
      weightedSum,
      expectedEfficiency
    })
  }, [])

  // Helper function to safely parse JSON fields (handles double-encoded JSON)
  const safeJsonParse = (jsonString: string | null | undefined, defaultValue: any[] = []) => {
    console.log('🔍 safeJsonParse called with:', { jsonString, type: typeof jsonString, defaultValue })
    if (!jsonString) {
      console.log('🔍 No jsonString, returning default:', defaultValue)
      return defaultValue
    }
    
    try {
      // First parse - might return a string if double-encoded
      let parsed = JSON.parse(jsonString)
      console.log('🔍 First parse result:', { parsed, type: typeof parsed, isArray: Array.isArray(parsed) })
      
      // If the result is still a string, parse it again (handles double-encoding)
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed)
          console.log('🔍 Second parse result:', { parsed, type: typeof parsed, isArray: Array.isArray(parsed) })
        } catch (secondError) {
          console.warn('Failed to parse double-encoded JSON:', parsed, secondError)
          return defaultValue
        }
      }
      
      console.log('🔍 Final parsed result:', { parsed, isArray: Array.isArray(parsed), length: Array.isArray(parsed) ? parsed.length : 'N/A' })
      return Array.isArray(parsed) ? parsed : defaultValue
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString, error)
      return defaultValue
    }
  }

  // Type for API data (serialized format)
  type StudySessionApiData = {
    subjectId: string | null
    durationMinutes: number
    startTime: string
    endTime: string
    notes: string | null
    efficiency: number | null
    sessionType: string | null
    productivity: number | null
    topicsCovered: string | null
    materialsUsed: string | null
  }

  // Use database hooks
  const {
    studySessions,
    loading: studySessionsLoading,
    error: studySessionsError,
    createStudySession,
    updateStudySession,
    deleteStudySession,
    refreshStudySessions
  } = useStudySessions()

  // Debug: Log study sessions data when it changes
  React.useEffect(() => {
    if (studySessions.length > 0) {
      console.log('🔍 Study sessions data received:', studySessions.map(session => ({
        id: session.id,
        topicsCovered: session.topicsCovered,
        materialsUsed: session.materialsUsed,
        topicsType: typeof session.topicsCovered,
        materialsType: typeof session.materialsUsed,
        currentEfficiency: session.efficiency
      })))
      
      // Check if any sessions need efficiency updates
      const sessionsNeedingUpdate = studySessions.filter(session => {
        const topicsCovered = safeJsonParse(session.topicsCovered)
        const materialsUsed = safeJsonParse(session.materialsUsed)
        return topicsCovered && materialsUsed && session.durationMinutes && session.productivity
      })
      
      if (sessionsNeedingUpdate.length > 0) {
        console.log('🔍 Found sessions that may need efficiency updates:', sessionsNeedingUpdate.length)
        // You can add logic here to update sessions if needed
      }
    }
  }, [studySessions])

  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError
  } = useSubjects()

  // Filter study sessions - moved to after useSubjects hook
  const filteredSessions = React.useMemo(() => {
    return studySessions.map(session => {
      // Recalculate efficiency for existing sessions to ensure consistency
      const topicsCovered = safeJsonParse(session.topicsCovered)
      const materialsUsed = safeJsonParse(session.materialsUsed)
      
      // Only recalculate if we have the necessary data
      let recalculatedEfficiency = session.efficiency
      if (topicsCovered && materialsUsed && session.durationMinutes && session.productivity) {
        console.log('🔍 Recalculating efficiency for session:', {
          id: session.id,
          topicsCovered: topicsCovered,
          materialsUsed: materialsUsed,
          durationMinutes: session.durationMinutes,
          productivity: session.productivity,
          topicsLength: Array.isArray(topicsCovered) ? topicsCovered.length : 'Not array',
          materialsLength: Array.isArray(materialsUsed) ? materialsUsed.length : 'Not array'
        })
        
        recalculatedEfficiency = calculateEfficiency({
          subjectId: session.subjectId || '',
          duration: session.durationMinutes,
          productivity: session.productivity,
          topicsCovered: Array.isArray(topicsCovered) ? topicsCovered : [],
          materialsUsed: Array.isArray(materialsUsed) ? materialsUsed : [],
          notes: session.notes || undefined
        })
        
        console.log('🔍 Efficiency recalculated:', {
          id: session.id,
          original: session.efficiency,
          recalculated: recalculatedEfficiency
        })
      } else {
        console.log('🔍 Skipping efficiency recalculation for session:', {
          id: session.id,
          hasTopics: !!topicsCovered,
          hasMaterials: !!materialsUsed,
          hasDuration: !!session.durationMinutes,
          hasProductivity: !!session.productivity
        })
      }
      
      // Return session with recalculated efficiency
      return {
        ...session,
        efficiency: recalculatedEfficiency
      }
    }).filter((session) => {
      // Only log once per session to avoid spam
      if (session.id === studySessions[0]?.id) {
        console.log('🔍 Processing session:', {
          id: session.id,
          topicsCovered: session.topicsCovered,
          materialsUsed: session.materialsUsed,
          topicsType: typeof session.topicsCovered,
          materialsType: typeof session.materialsUsed,
          originalEfficiency: studySessions.find(s => s.id === session.id)?.efficiency,
          recalculatedEfficiency: session.efficiency
        })
      }
      
      const subjectName = subjects.find(s => s.id === session.subjectId)?.name || 'Unknown Subject'
      const topicsCovered = safeJsonParse(session.topicsCovered)
      const materialsUsed = safeJsonParse(session.materialsUsed)
      const subjectId = session.subjectId
      const sessionType = session.sessionType
      
      // Debug logging only for sessions with data
      if (session.topicsCovered || session.materialsUsed) {
        console.log('🔍 Session data after parsing:', {
          id: session.id,
          topicsCovered: session.topicsCovered,
          parsedTopics: topicsCovered,
          materialsUsed: session.materialsUsed,
          parsedMaterials: materialsUsed
        })
      }
      
      const matchesSearch =
        subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topicsCovered.some((topic: string) => topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        session.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === "all" || subjectId === selectedSubject
      const matchesSessionType = selectedSessionType === "all" || sessionType === selectedSessionType
      return matchesSearch && matchesSubject && matchesSessionType
    }).sort((a, b) => {
      // Sort by creation date: newest first
      // Fallback to startTime if createdAt is not available
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.startTime).getTime()
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.startTime).getTime()
      
      // Debug: Log sorting information for first few sessions
      if (studySessions.indexOf(a) < 3) {
        console.log('🔍 Sorting session:', {
          id: a.id,
          createdAt: a.createdAt,
          startTime: a.startTime,
          sortDate: new Date(dateA).toISOString()
        })
      }
      
      return dateB - dateA
    })
  }, [studySessions, subjects, searchQuery, selectedSubject, selectedSessionType])

  const {
    testMarks,
    loading: testMarksLoading,
    error: testMarksError
  } = useTestMarks()

  const { autoMigrateIfNeeded } = useMigration()

  useEffect(() => {
    // Check authentication using NextAuth
    if (status === "loading") return // Wait for session to load
    
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Auto-migrate data if needed
    if (status === "authenticated") {
      autoMigrateIfNeeded()
    }
  }, [router, status, autoMigrateIfNeeded])

  // Listen for data update events to refresh data
  useEffect(() => {
    const handleSubjectUpdate = () => {
      console.log('Subject updated, refreshing study sessions data...')
      refreshStudySessions()
    }

    const handleStudySessionUpdate = () => {
      console.log('Study session updated, refreshing data...')
      refreshStudySessions()
    }

    // Add event listeners
    window.addEventListener('subject-updated', handleSubjectUpdate)
    window.addEventListener('study-session-updated', handleStudySessionUpdate)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('subject-updated', handleSubjectUpdate)
      window.removeEventListener('study-session-updated', handleStudySessionUpdate)
    }
  }, [refreshStudySessions])

  // Show loading state while checking authentication or loading data
  if (status === "loading" || studySessionsLoading || subjectsLoading || testMarksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading study sessions...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an authentication error
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your study sessions.</p>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Helper function to get week string
  const getWeekString = (date: Date | string) => {
    // Ensure we have a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date passed to getWeekString:', date)
      return 'Invalid-Date'
    }
    
    const year = dateObj.getFullYear()
    const week = Math.ceil(((dateObj.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
    return `${year}-W${week}`
  }

  // Helper function to convert Prisma StudySession to dialog format
  const convertToDialogFormat = (session: StudySession) => {
    // Handle both serialized (from API) and original Prisma data
    const startTime = typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime
    const endTime = typeof session.endTime === 'string' ? new Date(session.endTime) : session.endTime
    const createdAt = typeof session.createdAt === 'string' ? new Date(session.createdAt) : session.createdAt
    
    return {
      id: session.id,
      subjectId: session.subjectId || '',
      subjectName: subjects.find(s => s.id === session.subjectId)?.name || 'Unknown Subject',
      date: startTime.toISOString().split('T')[0],
      startTime: startTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      duration: session.durationMinutes,
      topicsCovered: safeJsonParse(session.topicsCovered),
      materialsUsed: safeJsonParse(session.materialsUsed),
      notes: session.notes || undefined,
      sessionType: session.sessionType as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study" || "Focused Study",
      productivity: (session.productivity as 1 | 2 | 3 | 4 | 5) || 3,
      createdAt: createdAt.toISOString()
    }
  }

  // Helper function to convert dialog format back to Prisma format
  const convertFromDialogFormat = (session: any) => {
    console.log('🔍 convertFromDialogFormat called with:', session)
    
    // Calculate new efficiency based on updated data
    const newEfficiency = calculateEfficiency({
      subjectId: session.subjectId,
      duration: session.duration,
      productivity: session.productivity,
      topicsCovered: session.topicsCovered,
      materialsUsed: session.materialsUsed,
      notes: session.notes
    })
    
    console.log('🔍 Calculated new efficiency:', newEfficiency)
    
    const result = {
      subjectId: session.subjectId,
      durationMinutes: session.duration,
      startTime: new Date(`${session.date}T${session.startTime}:00`).toISOString(),
      endTime: new Date(`${session.date}T${session.endTime}:00`).toISOString(),
      notes: session.notes,
      efficiency: newEfficiency, // Use calculated efficiency instead of session.efficiency
      sessionType: session.sessionType,
      productivity: session.productivity,
      topicsCovered: JSON.stringify(session.topicsCovered),
      materialsUsed: JSON.stringify(session.materialsUsed)
    }
    
    console.log('🔍 convertFromDialogFormat result:', result)
    return result
  }

  const handleAddSession = async (newSession: {
    subjectId: string
    duration: number
    startTime: string
    endTime: string
    notes?: string
    sessionType: string
    productivity: number
    topicsCovered: string[]
    materialsUsed: string[]
  }) => {
    try {
      // Calculate efficiency automatically
      const efficiency = calculateEfficiency(newSession)
      
      // Parse dates properly
      const sessionDate = new Date(newSession.startTime)
      if (isNaN(sessionDate.getTime())) {
        throw new Error('Invalid start time format')
      }
      
      const endDate = new Date(newSession.endTime)
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end time format')
      }

      // Create the session data in the format expected by the API
      const sessionData: StudySessionApiData = {
        subjectId: newSession.subjectId,
        durationMinutes: newSession.duration,
        startTime: sessionDate.toISOString(),
        endTime: endDate.toISOString(),
        notes: newSession.notes || null,
        efficiency: efficiency, // Use calculated efficiency
        sessionType: newSession.sessionType,
        productivity: newSession.productivity,
        topicsCovered: JSON.stringify(newSession.topicsCovered),
        materialsUsed: JSON.stringify(newSession.materialsUsed)
      }

      console.log('🔍 Creating study session with data:', {
        original: newSession,
        processed: sessionData,
        topicsCovered: newSession.topicsCovered,
        materialsUsed: newSession.materialsUsed
      })

      await createStudySession(sessionData as any) // Type assertion needed due to Prisma type mismatch
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      setDialogState({ ...dialogState, add: false })
    } catch (error) {
      console.error('Failed to create study session:', error)
      // Error handling is managed by the hook
    }
  }

  const handleEditSession = async (updatedSession: any) => {
    try {
      console.log('🔍 handleEditSession called with:', updatedSession)
      console.log('🔍 Updated session details:', {
        id: updatedSession.id,
        topicsCovered: updatedSession.topicsCovered,
        materialsUsed: updatedSession.materialsUsed,
        topicsCount: updatedSession.topicsCovered?.length || 0,
        materialsCount: updatedSession.materialsUsed?.length || 0,
        duration: updatedSession.duration,
        productivity: updatedSession.productivity
      })
      
      const convertedUpdates = convertFromDialogFormat(updatedSession)
      console.log('🔍 Converted updates:', convertedUpdates)
      
      console.log('🔍 About to call updateStudySession with:', {
        sessionId: updatedSession.id,
        updates: convertedUpdates
      })
      
      await updateStudySession(updatedSession.id, convertedUpdates as any) // Type assertion needed due to Prisma type mismatch
      
      console.log('🔍 Study session updated successfully')
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      setDialogState({ ...dialogState, edit: false })
      setSelectedSession(null)
    } catch (error) {
      console.error('Failed to update study session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteStudySession(sessionId)
      
      // Notify other pages to refresh their data
      notifyDataUpdate.studySession()
      
      setDialogState({ ...dialogState, delete: false })
      setSelectedSession(null)
    } catch (error) {
      console.error('Failed to delete study session:', error)
    }
  }

  const getSessionTypeColor = (sessionType: string | null) => {
    const typeColors: { [key: string]: string } = {
      "Focused Study": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Review": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Practice": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "Research": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Group Study": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    }
    return typeColors[sessionType || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }

  const getProductivityColor = (productivity: number | null) => {
    if (!productivity) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    const colors = [
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    ]
    return colors[productivity - 1] || colors[2]
  }

  const getProductivityLabel = (productivity: number | null) => {
    if (!productivity) return "Not rated"
    const labels = ["Very Low", "Low", "Medium", "High", "Very High"]
    return labels[productivity - 1] || "Medium"
  }

  const getEfficiencyColor = (efficiency: number | null) => {
    if (!efficiency) return "text-gray-600"
    if (efficiency >= 8) return "text-green-600"
    if (efficiency >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getEfficiencyLabel = (efficiency: number | null) => {
    if (!efficiency) return "Not rated"
    if (efficiency >= 8) return "Excellent"
    if (efficiency >= 6) return "Good"
    return "Needs Improvement"
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatDate = (date: Date | string) => {
    // Ensure we have a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date passed to formatDate:', date)
      return 'Invalid Date'
    }
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  const formatTime = (time: Date | string) => {
    // Ensure we have a Date object
    const timeObj = typeof time === 'string' ? new Date(time) : time
    
    // Check if the time is valid
    if (isNaN(timeObj.getTime())) {
      console.warn('Invalid time passed to formatTime:', time)
      return 'Invalid Time'
    }
    
    return timeObj.toTimeString().slice(0, 5)
  }

  // Calculate statistics
  const totalStudyTime = studySessions.reduce((total, session) => total + session.durationMinutes, 0)
  const averageSessionLength = studySessions.length > 0 ? totalStudyTime / studySessions.length : 0
  const totalSessions = studySessions.length
  const averageEfficiency = filteredSessions
    .filter(session => session.efficiency)
    .reduce((total, session) => total + (session.efficiency || 0), 0) / 
    filteredSessions.filter(session => session.efficiency).length || 0

  // Group sessions by week for the chart
  const weeklyData = studySessions.reduce((acc, session) => {
    const weekKey = getWeekString(session.startTime)
    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey, totalTime: 0, sessions: 0 }
    }
    acc[weekKey].totalTime += session.durationMinutes
    acc[weekKey].sessions += 1
    return acc
  }, {} as Record<string, { week: string; totalTime: number; sessions: number }>)

  const weeklyChartData = Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8) // Last 8 weeks

  return (
    <div className="min-h-screen bg-background">
      {/* Error Display */}
      {(studySessionsError || subjectsError || testMarksError) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">
              {studySessionsError || subjectsError || testMarksError}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Study Sessions</h1>
                <p className="text-sm text-muted-foreground">
                  Track your study time and productivity
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(totalStudyTime)}</div>
              <p className="text-xs text-muted-foreground">
                {totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(Math.round(averageSessionLength))}</div>
              <p className="text-xs text-muted-foreground">
                per session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-3">
                        <p className="font-semibold text-center text-white">Efficiency Score (0-10) based on:</p>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-blue-300">Topics Covered (40% weight)</p>
                            <div className="text-sm space-y-1 ml-2 text-gray-200">
                              <p>• 0 topics = 0 points</p>
                              <p>• 1-2 topics = 2 points</p>
                              <p>• 3-4 topics = 4 points</p>
                              <p>• 5+ topics = 5 points</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium text-green-300">Materials Used (30% weight)</p>
                            <div className="text-sm space-y-1 ml-2 text-gray-200">
                              <p>• 0 materials = 0 points</p>
                              <p>• 1 material = 1.5 points</p>
                              <p>• 2+ materials = 3 points</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium text-yellow-300">Session Duration (20% weight)</p>
                            <div className="text-sm space-y-1 ml-2 text-gray-200">
                              <p>• &lt; 30 min = 1 point</p>
                              <p>• 30-60 min = 1.5 points</p>
                              <p>• 1-2 hours = 2 points</p>
                              <p>• 2+ hours = 2.5 points</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium text-purple-300">Productivity Rating (10% weight)</p>
                            <div className="text-sm space-y-1 ml-2 text-gray-200">
                              <p>• User's self-rating (1-5) converted to 0-1 point</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageEfficiency.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">
                {getEfficiencyLabel(Math.round(averageEfficiency))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                consecutive days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search sessions, subjects, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Focused Study">Focused Study</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Practice">Practice</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Group Study">Group Study</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </div>

        {/* Study Sessions Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Study Sessions</h2>
            <p className="text-sm text-muted-foreground">Sorted by newest first</p>
          </div>
          <div className="grid gap-6 grid-cols-1">
            {filteredSessions.map((session) => (
            <Card key={session.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{subjects.find(s => s.id === session.subjectId)?.name || 'Unknown Subject'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(session.startTime)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSessionTypeColor(session.sessionType)}>
                      {session.sessionType || 'Unknown Type'}
                    </Badge>
                    {session.productivity && (
                      <Badge className={getProductivityColor(session.productivity)}>
                        {getProductivityLabel(session.productivity)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main session info in horizontal layout */}
                <div className="grid grid-cols-4 gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{formatDuration(session.durationMinutes)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-semibold">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </p>
                  </div>
                  {session.efficiency && (
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-muted-foreground">Efficiency</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-3">
                                <p className="font-semibold text-center text-white">Efficiency Score (0-10) based on:</p>
                                
                                <div className="space-y-2">
                                  <div>
                                    <p className="font-medium text-blue-300">Topics Covered (40% weight)</p>
                                    <div className="text-sm space-y-1 ml-2 text-gray-200">
                                      <p>• 0 topics = 0 points</p>
                                      <p>• 1-2 topics = 2 points</p>
                                      <p>• 3-4 topics = 4 points</p>
                                      <p>• 5+ topics = 5 points</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="font-medium text-green-300">Materials Used (30% weight)</p>
                                    <div className="text-sm space-y-1 ml-2 text-gray-200">
                                      <p>• 0 materials = 0 points</p>
                                      <p>• 1 material = 1.5 points</p>
                                      <p>• 2+ materials = 3 points</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="font-medium text-yellow-300">Session Duration (20% weight)</p>
                                    <div className="text-sm space-y-1 ml-2 text-gray-200">
                                      <p>• &lt; 30 min = 1 point</p>
                                      <p>• 30-60 min = 1.5 points</p>
                                      <p>• 1-2 hours = 2 points</p>
                                      <p>• 2+ hours = 2.5 points</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="font-medium text-purple-300">Productivity Rating (10% weight)</p>
                                    <div className="text-sm space-y-1 ml-2 text-gray-200">
                                      <p>• User's self-rating (1-5) converted to 0-1 point</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className={`font-semibold ${getEfficiencyColor(session.efficiency)}`}>
                        {session.efficiency}/10
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Topics</p>
                    <p className="font-semibold">{safeJsonParse(session.topicsCovered).length}</p>
                  </div>
                </div>

                {/* Notes section */}
                {session.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm line-clamp-2">{session.notes}</p>
                  </div>
                )}

                {/* Topics and Materials in horizontal layout */}
                <div className="grid grid-cols-2 gap-6">
                  {session.topicsCovered && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Topics Covered</p>
                      <div className="flex flex-wrap gap-1">
                        {safeJsonParse(session.topicsCovered).slice(0, 5).map((topic: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {safeJsonParse(session.topicsCovered).length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{safeJsonParse(session.topicsCovered).length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {session.materialsUsed && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Materials Used</p>
                      <div className="flex flex-wrap gap-1">
                        {safeJsonParse(session.materialsUsed).slice(0, 5).map((material: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                        {safeJsonParse(session.materialsUsed).length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{safeJsonParse(session.materialsUsed).length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setDialogState({ ...dialogState, edit: true })
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setDialogState({ ...dialogState, delete: true })
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No study sessions found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedSubject !== "all" || selectedSessionType !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding your first study session"}
            </p>
            {!searchQuery && selectedSubject === "all" && selectedSessionType === "all" && (
              <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Session
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddSessionDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        subjects={subjects}
        onAddSession={handleAddSession}
      />

      {selectedSession && (
        <>
          <EditSessionDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
            session={convertToDialogFormat(selectedSession)}
            subjects={subjects}
            onEditSession={handleEditSession}
          />

          <DeleteSessionDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
            session={convertToDialogFormat(selectedSession)}
            onDeleteSession={handleDeleteSession}
          />
        </>
      )}


    </div>
  )
}
