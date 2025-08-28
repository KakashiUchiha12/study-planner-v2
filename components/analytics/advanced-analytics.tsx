"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Target, 
  BookOpen,
  Award,
  Activity,
  BarChart3,
  HelpCircle
} from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isPast, isToday } from "date-fns"
import { 
  formatStudyTime, 
  calculateProgress, 
  calculateEfficiency, 
  getChartColors,
  getTimePeriods,
  getPerformanceBadgeVariant,
  getChartConfig
} from "@/lib/utils/dynamic-data"

/**
 * Represents a study session with timing and productivity data
 */
interface StudySession {
  /** Unique identifier for the session */
  id: string
  /** Start time when the session occurred (ISO string or Date object) */
  startTime: string | Date
  /** Duration of the session in minutes */
  durationMinutes: number
  /** Subject ID associated with the session (optional) */
  subjectId?: string | null
  /** Productivity rating from 1-5 (optional) */
  productivity?: number | null
  /** Additional notes about the session (optional) */
  notes?: string | null
}

interface TestMark {
  id: string
  testDate: string | Date
  subjectId: string
  score: number
  maxScore: number
  testName?: string
  testType?: string
  notes?: string | null
}

interface Task {
  id: string
  title: string
  description?: string | null
  subjectId?: string | null
  status: string
  completedAt?: string | Date | null
  dueDate?: string | Date | null
  createdAt: string | Date
  priority?: string
  estimatedTime?: number | null
}

interface Subject {
  id: string
  name: string
  color: string
  description?: string | null
  code?: string | null
  credits?: number
  instructor?: string | null
  totalChapters?: number
  completedChapters?: number
  totalMaterials?: number
  completedMaterials?: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface AnalyticsData {
  studySessions: StudySession[]
  testMarks: TestMark[]
  tasks: Task[]
  subjects: Subject[]
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData
}

// Dynamic chart colors
const COLORS = getChartColors(6)

export function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30")

  // Input validation and data sanitization
  const sanitizedData = useMemo(() => {
    if (!data) return { studySessions: [], testMarks: [], tasks: [], subjects: [] }
    
    // Debug: Log the raw data being received
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Advanced Analytics Raw Data:', {
        hasData: !!data,
        studySessionsCount: data.studySessions?.length || 0,
        testMarksCount: data.testMarks?.length || 0,
        subjectsCount: data.subjects?.length || 0,
        tasksCount: data.tasks?.length || 0,
        studySessionsSample: data.studySessions?.slice(0, 2).map(s => ({
          id: s.id,
          subjectId: s.subjectId,
          durationMinutes: s.durationMinutes,
          startTime: s.startTime
        })),
        subjectsSample: data.subjects?.slice(0, 2).map(s => ({
          id: s.id,
          name: s.name,
          totalChapters: s.totalChapters,
          completedChapters: s.completedChapters
        }))
      })
    }
    
    return {
      studySessions: Array.isArray(data.studySessions) ? data.studySessions : [],
      testMarks: Array.isArray(data.testMarks) ? data.testMarks : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      subjects: Array.isArray(data.subjects) ? data.subjects : []
    }
  }, [data])

  // Use dynamic utility function for time formatting
  const convertMinutesToHoursAndMinutes = formatStudyTime

  // Centralized date parsing utility
  const parseDate = (dateInput: string | Date): Date => {
    if (dateInput instanceof Date) return dateInput
    const parsed = new Date(dateInput)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${dateInput}`)
    }
    return parsed
  }

  // Safe date formatting utility
  const formatDateSafely = (dateInput: string | Date): string => {
    try {
      return format(parseDate(dateInput), 'yyyy-MM-dd')
    } catch {
      return format(new Date(), 'yyyy-MM-dd') // Fallback to today
    }
  }

     const analytics = useMemo(() => {
     const days = parseInt(timeRange)
     const startDate = subDays(new Date(), days)
     
     // Debug logging in development
     if (process.env.NODE_ENV === 'development') {
       console.log('Analytics Data Debug:', {
         totalStudySessions: sanitizedData.studySessions.length,
         totalTestMarks: sanitizedData.testMarks.length,
         totalSubjects: sanitizedData.subjects.length,
         testMarksSample: sanitizedData.testMarks.slice(0, 3),
         subjectsSample: sanitizedData.subjects.slice(0, 3),
         // Add more detailed test mark debugging
         testMarksDetails: sanitizedData.testMarks.map(t => ({
           id: t.id,
           subjectName: t.testName || 'Unknown',
           subjectId: t.subjectId,
           marksObtained: t.score,
           totalMarks: t.maxScore,
           percentage: t.score, // score is already a percentage
           date: t.testDate
         })),
         // Show raw test mark structure for debugging
         rawTestMarkStructure: sanitizedData.testMarks.length > 0 ? Object.keys(sanitizedData.testMarks[0]) : []
       })
     }
    
    // Filter data by time range
    const filteredSessions = sanitizedData.studySessions.filter(
      session => {
        try {
          return parseDate(session.startTime) >= startDate
        } catch {
          return false
        }
      }
    )
         const filteredTests = sanitizedData.testMarks.filter(
       test => {
         try {
           // Validate test mark data
           if (!test.subjectId || !test.score || !test.maxScore) {
             if (process.env.NODE_ENV === 'development') {
               console.warn('Invalid test mark data:', test)
             }
             return false
           }
           
           return parseDate(test.testDate) >= startDate
         } catch {
           return false
         }
       }
     )
     
      // Debug filtered tests
      if (process.env.NODE_ENV === 'development') {
        console.log('Filtered Tests Debug:', {
          totalTestMarks: sanitizedData.testMarks.length,
          filteredTestsCount: filteredTests.length,
          filteredTestsDetails: filteredTests.map(t => ({
            subjectName: t.testName || 'Unknown',
            marksObtained: t.score,
            totalMarks: t.maxScore,
            date: t.testDate
          }))
        })
      }
    const filteredTasks = sanitizedData.tasks.filter(
      task => {
        try {
          return parseDate(task.createdAt) >= startDate
        } catch {
          return false
        }
      }
    )

    // Study time analysis
    const dailyStudyTime = eachDayOfInterval({
      start: startDate,
      end: new Date()
    }).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
             const sessionsOnDay = filteredSessions.filter(s => {
         try {
           // Use centralized date parsing utility
           const sessionDateStr = formatDateSafely(s.startTime)
           return sessionDateStr === dayStr
         } catch (error) {
           // Log error in development only
           if (process.env.NODE_ENV === 'development') {
             console.warn('Error parsing session date:', s.startTime, error)
           }
           return false
         }
       })
      const totalTime = sessionsOnDay.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
      
      return {
        date: format(day, 'MMM dd'),
        studyTime: Math.round(totalTime / 60 * 10) / 10, // Convert to hours for chart display
        studyTimeFormatted: convertMinutesToHoursAndMinutes(totalTime), // Formatted for display
        studyTimeMinutes: totalTime, // Keep original minutes for calculations
        sessions: sessionsOnDay.length,
        productivity: sessionsOnDay.length > 0 
          ? Math.round(sessionsOnDay.reduce((sum, s) => sum + (s.productivity || 3), 0) / sessionsOnDay.length * 10) / 10
          : 0
      }
    })

    // Subject performance analysis
    const subjectAnalysis = sanitizedData.subjects.map(subject => {
      
      // Debug subject being processed
      if (process.env.NODE_ENV === 'development') {
        console.log(`Processing subject: ${subject.name}`, {
          id: subject.id,
          name: subject.name,
          totalChapters: subject.totalChapters,
          completedChapters: subject.completedChapters,
          progress: subject.progress
        })
      }
      
      const subjectSessions = filteredSessions.filter(s => {
        // Use subjectId for precise matching - this is the correct way
        if (s.subjectId && subject.id && s.subjectId === subject.id) {
          return true
        }
        
        // Fallback: If no subjectId, try to match by subject name (for backward compatibility)
        // But this should rarely happen with proper Prisma data
        const sessionSubjectName = s.subjectId || ''
        const subjectName = subject.name || ''
        
        // Only use name matching as a last resort
        return sessionSubjectName.toLowerCase() === subjectName.toLowerCase()
      })
      
      // Debug subject-session matching
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Subject-Session Matching Debug for ${subject.name}:`, {
          subjectId: subject.id,
          subjectName: subject.name,
          totalFilteredSessions: filteredSessions.length,
          sessionSamples: filteredSessions.slice(0, 3).map(s => ({
            sessionId: s.id,
            sessionSubjectId: s.subjectId,
            sessionDuration: s.durationMinutes,
            sessionStartTime: s.startTime
          })),
          matchedSessions: subjectSessions.length,
          matchedSessionIds: subjectSessions.map(s => s.id),
          totalStudyTime: subjectSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
        })
      }
      
             const subjectTests = filteredTests.filter(t => {
          // Use subjectId for precise matching if available, otherwise fall back to name matching
          if (t.subjectId && subject.id && t.subjectId === subject.id) {
            return true
          }
          
          // Fallback to name-based matching for backward compatibility
          const testSubject = t.testName || ''
          const subjectName = subject.name || ''
          
          // More flexible matching - handle variations in subject names
          const normalizedTestSubject = testSubject.toLowerCase().trim()
          const normalizedSubjectName = subjectName.toLowerCase().trim()
          
          // Exact match
          if (normalizedTestSubject === normalizedSubjectName) return true
          
          // Partial match (if test subject contains subject name or vice versa)
          if (normalizedTestSubject.includes(normalizedSubjectName) || 
              normalizedSubjectName.includes(normalizedTestSubject)) return true
          
          // Handle common variations
          if (normalizedTestSubject === 'general studies' && normalizedSubjectName === 'general studies') return true
          if (normalizedTestSubject === 'general' && normalizedSubjectName === 'general studies') return true
          
          return false
        })
       
       // Debug subject test matching
       if (process.env.NODE_ENV === 'development') {
         console.log(`Subject Test Matching Debug for ${subject.name}:`, {
           subjectName: subject.name,
           filteredTestsCount: filteredTests.length,
           subjectTestsCount: subjectTests.length,
           testSubjects: filteredTests.map(t => t.testName),
           matchedTests: subjectTests.map(t => ({
             subjectName: t.testName,
             marksObtained: t.score,
             totalMarks: t.maxScore
           }))
         })
       }
       
       const totalStudyTime = subjectSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
       
               // Calculate average test score - properly calculate percentage from marks
        let avgTestScore = 0
        if (subjectTests.length > 0) {
          const totalScore = subjectTests.reduce((sum, t) => {
            // Calculate percentage from marks obtained vs total marks
            const marksObtained = Number(t.score) || 0
            const totalMarks = Number(t.maxScore) || 100
            
            if (totalMarks > 0) {
              const percentage = (marksObtained / totalMarks) * 100
              console.log(`📊 Test Score Calculation: ${marksObtained}/${totalMarks} = ${percentage}%`)
              return sum + percentage
            }
            return sum
          }, 0)
          
          avgTestScore = Math.round(totalScore / subjectTests.length)
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Subject: ${subject.name}`, {
              testCount: subjectTests.length,
              testScores: subjectTests.map(t => ({ 
                marksObtained: t.score, 
                totalMarks: t.maxScore, 
                percentage: (Number(t.score) / Number(t.maxScore)) * 100,
                subjectName: t.testName 
              })),
              avgTestScore,
              totalStudyTime,
              totalStudyTimeAllSubjects: sanitizedData.studySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
            })
          }
        }

                           // Calculate progress using dynamic utility
              const progress = calculateProgress(subject.completedChapters || 0, subject.totalChapters || 0)
              
                            // Calculate efficiency using dynamic utility with better handling
               const totalStudyTimeAllSubjects = sanitizedData.studySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
               
               // Enhanced efficiency calculation
               let efficiency = 0
               if (totalStudyTime > 0 && totalStudyTimeAllSubjects > 0) {
                 if (avgTestScore > 0) {
                   // Base efficiency on test performance and study time allocation
                   const testScoreRatio = Math.max(0, avgTestScore) / 100 // Ensure non-negative
                   const studyTimeRatio = totalStudyTime / totalStudyTimeAllSubjects
                   
                   // Efficiency = (Test Score × Study Time Ratio) × 100
                   efficiency = Math.round(testScoreRatio * studyTimeRatio * 100)
                 } else {
                   // Fallback: Calculate efficiency based on study time allocation only
                   // This gives some credit for focused study even without test scores
                   const studyTimeRatio = totalStudyTime / totalStudyTimeAllSubjects
                   efficiency = Math.round(studyTimeRatio * 50) // Max 50% without test scores
                 }
                 
                 // Cap efficiency at 100%
                 efficiency = Math.min(100, Math.max(0, efficiency))
               }
      
      return {
        name: subject.name,
        studyTime: Math.round(totalStudyTime / 60 * 10) / 10,
        studyTimeFormatted: convertMinutesToHoursAndMinutes(totalStudyTime),
        testScore: avgTestScore,
        sessions: subjectSessions.length,
        progress: progress,
        efficiency: efficiency,
        totalChapters: subject.totalChapters || 0,
        completedChapters: subject.completedChapters || 0
      }
    })

    // Productivity patterns - using session date instead of startTime since startTime is not stored
    const hourlyProductivity = Array.from({ length: 24 }, (_, hour) => {
      // Since we don't have startTime, we'll use a simplified approach
      // Group sessions by hour based on creation time or use a default distribution
      const sessionsAtHour = filteredSessions.filter(s => {
        try {
          // Use centralized date parsing utility
          const sessionDate = parseDate(s.startTime)
          const sessionHour = sessionDate.getHours()
          return sessionHour === hour
        } catch (error) {
          // Log error in development only
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error parsing session date for hourly productivity:', s.startTime, error)
          }
          return false
        }
      })
      
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        productivity: sessionsAtHour.length > 0
          ? Math.round(sessionsAtHour.reduce((sum, s) => sum + (s.productivity || 3), 0) / sessionsAtHour.length * 10) / 10
          : 0,
        sessions: sessionsAtHour.length
      }
    }).filter(h => h.sessions > 0)

    // Task completion analysis - properly calculate from database fields
    const taskAnalysis = {
      completed: filteredTasks.filter(t => {
        // Task is completed if completedAt is set OR status is "completed"
        return t.completedAt || t.status === "completed"
      }).length,
      pending: filteredTasks.filter(t => {
        // Task is pending if not completed
        return !t.completedAt && t.status !== "completed"
      }).length,
      overdue: filteredTasks.filter(t => {
        // Task is overdue if not completed, has due date, and due date is in the past
        const isCompleted = t.completedAt || t.status === "completed"
        const hasDueDate = t.dueDate
        const isOverdue = hasDueDate && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
        return !isCompleted && isOverdue
      }).length
    }

    // Debug logging for task completion calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Task Completion Debug:', {
        totalTasks: filteredTasks.length,
        taskAnalysis,
        sampleTasks: filteredTasks.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          completedAt: t.completedAt,
          dueDate: t.dueDate,
          isCompleted: t.completedAt || t.status === "completed"
        }))
      })
    }

    // Weekly comparison
    const thisWeek = filteredSessions.filter(s => {
      try {
        const sessionDate = parseDate(s.startTime)
        const weekStart = startOfWeek(new Date())
        const weekEnd = endOfWeek(new Date())
        return sessionDate >= weekStart && sessionDate <= weekEnd
      } catch {
        return false
      }
    })

    const lastWeek = sanitizedData.studySessions.filter(s => {
      try {
        const sessionDate = parseDate(s.startTime)
        const lastWeekStart = startOfWeek(subDays(new Date(), 7))
        const lastWeekEnd = endOfWeek(subDays(new Date(), 7))
        return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd
      } catch {
        return false
      }
    })

    const weekComparison = {
      thisWeek: thisWeek.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60,
      lastWeek: lastWeek.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60,
      change: 0
    }
    
    // Only calculate change if there's valid data for last week
    if (weekComparison.lastWeek > 0) {
      weekComparison.change = Math.round(((weekComparison.thisWeek - weekComparison.lastWeek) / weekComparison.lastWeek) * 100)
    } else if (weekComparison.thisWeek > 0) {
      // If no last week data but this week has data, show 100% increase
      weekComparison.change = 100
    } else {
      // No data for either week
      weekComparison.change = 0
    }



    return {
      dailyStudyTime,
      subjectAnalysis,
      hourlyProductivity,
      taskAnalysis,
      weekComparison,
      totalStudyTime: Math.round(filteredSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60 * 10) / 10,
      totalStudyTimeMinutes: filteredSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
      averageProductivity: filteredSessions.length > 0
        ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.productivity || 3), 0) / filteredSessions.length * 10) / 10
        : 0
    }
  }, [data, timeRange])

  const pieData = [
    { name: 'Completed', value: analytics.taskAnalysis.completed, color: COLORS[0] },
    { name: 'Pending', value: analytics.taskAnalysis.pending, color: COLORS[1] },
    { name: 'Overdue', value: analytics.taskAnalysis.overdue, color: COLORS[2] }
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Deep insights into your study patterns and performance</p>
        </div>
                                   <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getTimePeriods().map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
                <p className="text-2xl font-bold">{convertMinutesToHoursAndMinutes(analytics.totalStudyTimeMinutes)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Productivity</p>
                <p className="text-2xl font-bold">{analytics.averageProductivity}/5</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Change</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{Math.abs(analytics.weekComparison.change)}%</p>
                  {analytics.weekComparison.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                                 <p className="text-2xl font-bold">
                   {(() => {
                     const total = analytics.taskAnalysis.completed + analytics.taskAnalysis.pending
                     return total > 0 ? Math.round((analytics.taskAnalysis.completed / total) * 100) : 0
                   })()}%
                 </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Study Time Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
                         <ResponsiveContainer width="100%" height={getChartConfig().height}>
               {analytics.dailyStudyTime.length > 0 ? (
                <LineChart data={analytics.dailyStudyTime}>
                  <CartesianGrid strokeDasharray={getChartConfig().grid.strokeDasharray} />
                  <XAxis dataKey="date" />
                  <YAxis />
                                     <Tooltip 
                     formatter={(value: any, name: any) => {
                       if (name === "Hours Studied") {
                         return [`${value}h`, name]
                       } else if (name === "Productivity Rating") {
                         return [`${value}/5`, name]
                       }
                       return [value, name]
                     }}
                     labelFormatter={(label) => `Date: ${label}`}
                   />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="studyTime" 
                    stroke={COLORS[0]} 
                    strokeWidth={2}
                    name="Hours Studied"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke={COLORS[1]} 
                    strokeWidth={2}
                    name="Productivity Rating"
                  />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>No study data available for this period</p>
                    <p className="text-xs mt-1">Start studying to see your daily trends!</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

                 {/* Subject Performance */}
         <Card>
           <CardHeader>
             <CardTitle>Subject Performance</CardTitle>
           </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={getChartConfig().height}>
               {analytics.subjectAnalysis.length > 0 ? (
                 <RadarChart data={analytics.subjectAnalysis}>
                   <PolarGrid />
                   <PolarAngleAxis dataKey="name" />
                   <PolarRadiusAxis angle={90} domain={[0, 100]} />
                   <Radar
                     name="Progress %"
                     dataKey="progress"
                     stroke={COLORS[0]}
                     fill={COLORS[0]}
                     fillOpacity={0.3}
                   />
                   <Radar
                     name="Test Score %"
                     dataKey="testScore"
                     stroke={COLORS[1]}
                     fill={COLORS[1]}
                     fillOpacity={0.3}
                   />
                   <Legend />
                 </RadarChart>
               ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                   <div className="text-center">
                     <Target className="h-12 w-12 mx-auto mb-2" />
                     <p>No subject data available</p>
                     <p className="text-xs mt-1">Add subjects to see performance analysis!</p>
                   </div>
                 </div>
               )}
             </ResponsiveContainer>
           </CardContent>
         </Card>

        {/* Hourly Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
                         <ResponsiveContainer width="100%" height={getChartConfig().height}>
               <BarChart data={analytics.hourlyProductivity}>
                                 <CartesianGrid strokeDasharray={getChartConfig().grid.strokeDasharray} />
                 <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
                         <ResponsiveContainer width="100%" height={getChartConfig().height}>
               <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

             {/* Subject Details Table */}
       <Card>
         <CardHeader>
           <CardTitle>Subject Performance Details</CardTitle>
         </CardHeader>
                   <CardContent>
            <div className="w-full">
              <table className="w-full">
                               <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Subject</th>
                    <th className="text-left p-3">Study Time</th>
                    <th className="text-left p-3">Sessions</th>
                    <th className="text-left p-3">Avg Test Score</th>
                                        <th className="text-left p-3">
                      <div className="flex items-center gap-1">
                        Progress
                        <div className="relative group">
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          {/* Tooltip (Positioned Outside and Above the Table) */}
                          <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[100] border-2 border-border">
                            <div className="text-xs">
                              <strong>Progress Calculation:</strong><br/>
                              • Progress is based on chapter completion<br/>
                              • Formula: (Completed Chapters / Total Chapters) × 100<br/>
                              • Shows how much of the subject content has been covered
                            </div>
                            {/* Arrow pointing down to the help icon */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                                       <th className="text-left p-3">
                      <div className="flex items-center gap-1">
                        Efficiency
                        <div className="relative group">
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          {/* Tooltip (Positioned Outside and Above the Table) */}
                          <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[100] border-2 border-border">
                            <div className="text-xs">
                              <strong>Efficiency Calculation:</strong><br/>
                              • Based on test performance and study time allocation<br/>
                              • Formula: (Test Score × Study Time Ratio) × 100<br/>
                              • Higher efficiency = better test scores with focused study time
                            </div>
                            {/* Arrow pointing down to the help icon */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                 </tr>
               </thead>
               <tbody>
                                   {analytics.subjectAnalysis.map((subject, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium min-w-[120px]">{subject.name}</td>
                      <td className="p-4 min-w-[100px]">{subject.studyTimeFormatted}</td>
                      <td className="p-4 text-center min-w-[80px]">{subject.sessions}</td>
                      <td className="p-4 min-w-[120px]">
                        <Badge variant={getPerformanceBadgeVariant(subject.testScore)}>
                          {subject.testScore}%
                        </Badge>
                      </td>
                                           <td className="p-4 min-w-[200px]">
                        <div className="space-y-2">
                          <div className="relative group">
                            {/* Progress Bar */}
                            <div className="w-full bg-muted rounded-full h-3 relative">
                              <div 
                                className="bg-primary h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${subject.progress}%` }}
                              />
                              {subject.totalChapters && subject.totalChapters > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-medium text-foreground drop-shadow-sm">
                                    {subject.completedChapters || 0}/{subject.totalChapters}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tooltip (Positioned Outside and Above the Card) */}
                            <div className="absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[100] border-2 border-border">
                              <div className="text-xs">
                                <strong>Chapter Progress:</strong><br/>
                                • Completed: {subject.completedChapters || 0} chapters<br/>
                                • Total: {subject.totalChapters || 0} chapters<br/>
                                • Progress: {subject.progress}%<br/>
                                <br/>
                                <strong>Formula:</strong><br/>
                                ({subject.completedChapters || 0} ÷ {subject.totalChapters || 0}) × 100
                              </div>
                              {/* Arrow pointing down to the progress bar */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {subject.totalChapters && subject.totalChapters > 0 ? (
                              <span>
                                {subject.completedChapters || 0} of {subject.totalChapters} chapters completed
                              </span>
                            ) : (
                              <span>No chapters defined</span>
                            )}
                          </div>
                        </div>
                      </td>
                     <td className="p-4 min-w-[150px]">
                       <div className="flex items-center gap-2">
                         <Badge 
                           variant={getPerformanceBadgeVariant(subject.efficiency)}
                           className="text-xs"
                         >
                           {subject.efficiency}%
                         </Badge>
                         <div className="relative group">
                           <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                           {/* Tooltip (Positioned Outside and Above the Card) */}
                           <div className="absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[100] border-2 border-border">
                             <div className="text-xs">
                               <strong>Efficiency Breakdown:</strong><br/>
                               • Test Score: {subject.testScore}%<br/>
                               • Study Time: {subject.studyTimeFormatted}<br/>
                               • Efficiency: {subject.efficiency}%<br/>
                               <br/>
                               <strong>Formula:</strong><br/>
                               (Test Score × Study Time Ratio) × 100
                             </div>
                             {/* Arrow pointing down to the help icon */}
                             <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                           </div>
                         </div>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
    </div>
  )
}
