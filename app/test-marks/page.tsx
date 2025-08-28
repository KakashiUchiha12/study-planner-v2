"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Plus, Edit, Trash2, TrendingUp, TrendingDown, Minus, MoreHorizontal, BookOpen, Target, Clock, Award, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useTestMarks, useSubjects, useMigration } from '@/hooks'
import { AddTestDialog } from '@/components/test-marks/add-test-dialog'
import { EditTestDialog } from '@/components/test-marks/edit-test-dialog'
import { DeleteTestDialog } from '@/components/test-marks/delete-test-dialog'
import { TestPerformanceChart } from "@/components/test-marks/test-performance-chart"
import { ThemeToggle } from "@/components/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { TestMark as PrismaTestMark, Subject as PrismaSubject } from "@prisma/client"

// Extend the Prisma TestMark type to include the mistakes field
type ExtendedTestMark = Omit<PrismaTestMark, 'testDate'> & {
  testDate: Date | string
  mistakes?: string | null
}

interface Mistake {
  id: string
  question: string
  correctAnswer: string
  yourAnswer: string
  explanation?: string
  topic?: string
  difficulty: "Easy" | "Medium" | "Hard"
}

interface TestMark {
  id: string
  testName: string
  subjectId: string
  subjectName: string
  date: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  comments?: string
  testType: "Quiz" | "Midterm" | "Final" | "Assignment" | "Project"
  mistakes?: Mistake[]
  createdAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

export default function TestMarksPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedTestType, setSelectedTestType] = useState<string>("all")
  const [selectedTest, setSelectedTest] = useState<TestMark | null>(null)
  const [expandedMistakes, setExpandedMistakes] = useState<Set<string>>(new Set())
  const [showAllMistakes, setShowAllMistakes] = useState(false)
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
  })
  const router = useRouter()

  // Use database hooks
  const {
    testMarks,
    loading: testMarksLoading,
    error: testMarksError,
    createTestMark,
    updateTestMark,
    deleteTestMark,
    refreshTestMarks
  } = useTestMarks()

  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError
  } = useSubjects()

  const { autoMigrateIfNeeded } = useMigration()

  // Calculate grade based on percentage
  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'A-'
    if (percentage >= 75) return 'B+'
    if (percentage >= 70) return 'B'
    if (percentage >= 65) return 'B-'
    if (percentage >= 60) return 'C+'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'C-'
    if (percentage >= 45) return 'D+'
    if (percentage >= 40) return 'D'
    return 'F'
  }

  // Convert Prisma TestMark to local TestMark interface
  const convertPrismaTestMark = (prismaMark: ExtendedTestMark): TestMark => {
    // Calculate percentage and grade on the frontend
    const percentage = Math.round((prismaMark.score / prismaMark.maxScore) * 100)
    const grade = calculateGrade(percentage)
    
    // Handle testDate which could be a Date object or string
    let testDate: string
    if (prismaMark.testDate instanceof Date) {
      testDate = prismaMark.testDate.toISOString().split('T')[0]
    } else if (typeof prismaMark.testDate === 'string') {
      // Handle timestamp strings (like "1756857600000")
      if (/^\d{13}$/.test(prismaMark.testDate)) {
        // It's a timestamp in milliseconds
        testDate = new Date(parseInt(prismaMark.testDate)).toISOString().split('T')[0]
      } else {
        // It's a regular date string
        testDate = prismaMark.testDate.split('T')[0]
      }
    } else {
      testDate = new Date(prismaMark.testDate as any).toISOString().split('T')[0]
    }
    
    return {
      id: prismaMark.id,
      testName: prismaMark.testName,
      subjectId: prismaMark.subjectId,
      subjectName: subjects.find(s => s.id === prismaMark.subjectId)?.name || 'Unknown Subject',
      date: testDate,
      marksObtained: prismaMark.score,
      totalMarks: prismaMark.maxScore,
      percentage,
      grade,
      comments: prismaMark.notes || undefined,
      testType: prismaMark.testType as "Quiz" | "Midterm" | "Final" | "Assignment" | "Project",
      mistakes: prismaMark.mistakes ? JSON.parse(prismaMark.mistakes) : [],
      createdAt: prismaMark.createdAt instanceof Date 
        ? prismaMark.createdAt.toISOString()
        : typeof prismaMark.createdAt === 'string'
          ? /^\d{13}$/.test(prismaMark.createdAt)
            ? new Date(parseInt(prismaMark.createdAt)).toISOString()
            : prismaMark.createdAt
          : new Date(prismaMark.createdAt as any).toISOString()
    }
  }

  // Convert Prisma Subject to local Subject interface
  const convertPrismaSubject = (prismaSubject: PrismaSubject): Subject => {
    return {
      id: prismaSubject.id,
      name: prismaSubject.name,
      color: prismaSubject.color
    }
  }

  // Convert subjects to the format expected by the component
  const localSubjects = subjects.map(convertPrismaSubject)
  
  // Convert test marks to the format expected by the component
  const localTestMarks = testMarks.map(convertPrismaTestMark)

  // Search functionality (no predictive typing)

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

  // Show loading state while checking authentication or loading data
  if (status === "loading" || testMarksLoading || subjectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading test marks...</p>
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
          <p className="text-muted-foreground mb-4">Please sign in to view your test marks.</p>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Convert local TestMark to Prisma TestMark data
  const convertToPrismaData = (testMark: Omit<TestMark, "id">) => {
    return {
      subjectId: testMark.subjectId,
      testName: testMark.testName,
      testType: testMark.testType,
      testDate: testMark.date, // Keep as string since that's what the hook expects
      score: testMark.marksObtained,
      maxScore: testMark.totalMarks,
      notes: testMark.comments || undefined
    }
  }

  // Get grade color based on percentage
  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  // Get percentage color based on score
  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get subject color based on subject name
  const getSubjectColor = (subjectName: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-red-100 text-red-800 border-red-200'
    ]
    const index = subjectName.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Get test type color
  const getTestTypeColor = (testType: string): string => {
    const typeColors: { [key: string]: string } = {
      "Quiz": "bg-blue-100 text-blue-800 border-blue-200",
      "Midterm": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Final": "bg-red-100 text-red-800 border-red-200",
      "Assignment": "bg-green-100 text-green-800 border-green-200",
      "Project": "bg-purple-100 text-purple-800 border-purple-200",
    }
    return typeColors[testType] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const initializeSampleTestMarks = () => {
    // This function is no longer needed as data comes from database
    // Sample data is created automatically by the database service
    console.log('Sample data initialization handled by database service')
  }

  const handleAddTestMark = async (newTestMark: Omit<TestMark, "id" | "percentage" | "grade" | "createdAt">) => {
    try {
      console.log('🔍 handleAddTestMark called with:', newTestMark)
      
      // Extract only the fields needed for creation and map to API format
      const testData = {
        subjectId: newTestMark.subjectId,
        testName: newTestMark.testName,
        testType: newTestMark.testType,
        testDate: newTestMark.date,
        score: newTestMark.marksObtained,
        maxScore: newTestMark.totalMarks,
        notes: newTestMark.comments,
        mistakes: newTestMark.mistakes
      }
      
      console.log('🔍 Sending test data to API:', testData)
      
      await createTestMark(testData)
      setDialogState({ ...dialogState, add: false })
    } catch (error) {
      console.error('Failed to create test mark:', error)
      // Error handling is managed by the hook
    }
  }

  const handleEditTestMark = async (updatedTestMark: TestMark) => {
    try {
      await updateTestMark(updatedTestMark.id, convertToPrismaData(updatedTestMark))
    setDialogState({ ...dialogState, edit: false })
    setSelectedTest(null)
    } catch (error) {
      console.error('Failed to update test mark:', error)
      // Error handling is managed by the hook
    }
  }

  const handleDeleteTestMark = async (testMarkId: string) => {
    try {
      await deleteTestMark(testMarkId)
    setDialogState({ ...dialogState, delete: false })
    setSelectedTest(null)
    } catch (error) {
      console.error('Failed to delete test mark:', error)
      // Error handling is managed by the hook
    }
  }

  const filteredTestMarks = localTestMarks.filter((testMark) => {
    const matchesSearch =
      testMark.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testMark.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testMark.comments?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || testMark.subjectId === selectedSubject
    const matchesTestType = selectedTestType === "all" || testMark.testType === selectedTestType
    return matchesSearch && matchesSubject && matchesTestType
  }).sort((a, b) => {
    // Sort by creation date: newest first
    // Fallback to test date if createdAt is not available
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime()
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime()
    
    return dateB - dateA
  })

  const toggleMistakesExpansion = (testId: string) => {
    setExpandedMistakes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
    } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Error Display */}
      {(testMarksError || subjectsError) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">
              {testMarksError || subjectsError}
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
                <h1 className="text-2xl font-bold">Test Marks</h1>
                <p className="text-sm text-muted-foreground">
                  Track your academic performance and test results
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
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                  placeholder="Search test marks, subjects, or comments..."
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
                {localSubjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTestType} onValueChange={setSelectedTestType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Test Types" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Test Types</SelectItem>
              <SelectItem value="Quiz">Quiz</SelectItem>
              <SelectItem value="Midterm">Midterm</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
              <SelectItem value="Assignment">Assignment</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
            </SelectContent>
          </Select>
            <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>
        </div>

        {/* Performance Summary */}
        {filteredTestMarks.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tests */}
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredTestMarks.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
                  <div className="text-xs text-gray-500 mt-1">Attempted</div>
                </div>
              </Card>

              {/* Average Percentage */}
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(filteredTestMarks.reduce((sum, test) => sum + test.percentage, 0) / filteredTestMarks.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average</div>
                  <div className="text-xs text-gray-500 mt-1">Performance</div>
                </div>
              </Card>

              {/* Total Mistakes */}
              <Card 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                onClick={() => setShowAllMistakes(true)}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredTestMarks.reduce((sum, test) => sum + (test.mistakes?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  <div className="text-xs text-gray-500 mt-1">Mistakes</div>
                </div>
              </Card>

              {/* Best Performance */}
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...filteredTestMarks.map(t => t.percentage))}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best</div>
                  <div className="text-xs text-gray-500 mt-1">Score</div>
                </div>
              </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Subject Breakdown */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">
                    {new Set(filteredTestMarks.map(t => t.subjectName)).size}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
                  <div className="text-xs text-gray-500 mt-1">Tested</div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {filteredTestMarks.filter(t => {
                      const testDate = new Date(t.date)
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                      return testDate >= thirtyDaysAgo
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tests</div>
                  <div className="text-xs text-gray-500 mt-1">Last 30 Days</div>
                </div>
              </Card>

              {/* Improvement Trend */}
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-600">
                    {(() => {
                      const recentTests = filteredTestMarks.slice(0, 5)
                      const olderTests = filteredTestMarks.slice(-5)
                      if (recentTests.length < 2 || olderTests.length < 2) return 'N/A'
                      
                      const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / recentTests.length
                      const olderAvg = olderTests.reduce((sum, t) => sum + t.percentage, 0) / olderTests.length
                      const improvement = recentAvg - olderAvg
                      
                      return improvement > 0 ? `+${Math.round(improvement)}%` : `${Math.round(improvement)}%`
                    })()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
                  <div className="text-xs text-gray-500 mt-1">Recent vs Older</div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Test Marks Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Test Marks</h2>
            <p className="text-sm text-muted-foreground">Sorted by newest first</p>
          </div>
          <div className="grid gap-6 grid-cols-1">
          {filteredTestMarks.map((testMark) => (
            <Card key={testMark.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-4 hover:border-l-blue-500">
              <CardContent className="p-6">
                {/* Header with subject and test info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSubjectColor(testMark.subjectName)}>
                        {testMark.subjectName}
                      </Badge>
                      <Badge className={getTestTypeColor(testMark.testType)}>
                        {testMark.testType === 'Quiz' && '📝'}
                        {testMark.testType === 'Midterm' && '📚'}
                        {testMark.testType === 'Final' && '🎯'}
                        {testMark.testType === 'Assignment' && '📋'}
                        {testMark.testType === 'Project' && '💼'}
                        {testMark.testType}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {testMark.testName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>📅 {testMark.date}</span>
                      {testMark.mistakes && testMark.mistakes.length > 0 && (
                        <span className="text-orange-500">⚠️ {testMark.mistakes.length} mistakes</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getGradeColor(testMark.percentage)} text-lg px-3 py-1`}>
                      {testMark.grade}
                    </Badge>
                    {/* Performance trend indicator */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {testMark.percentage >= 90 ? '🌟 Excellent' :
                       testMark.percentage >= 80 ? '👍 Good' :
                       testMark.percentage >= 70 ? '📈 Fair' :
                       testMark.percentage >= 60 ? '⚠️ Needs Work' : '🚨 Critical'}
                    </div>
                  </div>
                </div>

                {/* Score and percentage section */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {testMark.marksObtained}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPercentageColor(testMark.percentage)}`}>
                      {testMark.percentage}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Percentage
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {testMark.totalMarks}
                  </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total
                    </div>
                  </div>
                        </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Performance</span>
                    <span>{testMark.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        testMark.percentage >= 90 ? 'bg-emerald-500' :
                        testMark.percentage >= 80 ? 'bg-blue-500' :
                        testMark.percentage >= 70 ? 'bg-yellow-500' :
                        testMark.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${testMark.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Comments */}
                {testMark.comments && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {testMark.comments}
                    </p>
                        </div>
                        )}

                {/* Mistakes section */}
                {testMark.mistakes && testMark.mistakes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Areas for Improvement ({testMark.mistakes.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {testMark.mistakes.slice(0, 2).map((mistake, index) => (
                        <div key={index} className="text-xs bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {mistake.question}
                            </span>
                            <Badge variant="outline" className="text-xs px-2 py-0">
                                {mistake.difficulty}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                              <span className="text-red-600 font-medium">Your Answer:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.yourAnswer}</div>
                              </div>
                              <div>
                              <span className="text-green-600 font-medium">Correct:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.correctAnswer}</div>
                              </div>
                            </div>
                            {mistake.explanation && (
                            <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                              <span className="text-orange-600 font-medium">💡 Explanation:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.explanation}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      {testMark.mistakes.length > 2 && (
                        <div className="text-center">
                          <Button variant="ghost" size="sm" className="text-xs text-orange-600 hover:text-orange-700">
                            +{testMark.mistakes.length - 2} more mistakes
                          </Button>
                      </div>
                    )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                      variant="outline"
                          size="sm"
                          onClick={() => {
                        setSelectedTest(testMark)
                            setDialogState({ ...dialogState, edit: true })
                          }}
                    className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                        </Button>
                        <Button
                      variant="outline"
                          size="sm"
                          onClick={() => {
                        setSelectedTest(testMark)
                            setDialogState({ ...dialogState, delete: true })
                          }}
                    className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                        >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                        </Button>
                </div>

                {/* Quick stats footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>📊 Performance: {testMark.percentage}%</span>
                    <span>🎯 Goal: {testMark.percentage >= 90 ? 'A+' : testMark.percentage >= 80 ? 'A' : testMark.percentage >= 70 ? 'B' : 'C'}</span>
                    {testMark.mistakes && testMark.mistakes.length > 0 && (
                      <span className="text-orange-500">📝 {testMark.mistakes.length} areas to improve</span>
                    )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
        </div>

        {/* Empty State */}
        {filteredTestMarks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No test marks found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedSubject !== "all" || selectedTestType !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding your first test result"}
            </p>
            {!searchQuery && selectedSubject === "all" && selectedTestType === "all" && (
              <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Test
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddTestDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        subjects={localSubjects}
        onAddTest={handleAddTestMark}
      />

      {selectedTest && (
          <EditTestDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
          test={selectedTest}
        subjects={localSubjects}
          onEditTest={handleEditTestMark}
          />
      )}

      {selectedTest && (
          <DeleteTestDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
          test={selectedTest}
          onDeleteTest={handleDeleteTestMark}
        />
      )}

      {/* All Mistakes Modal */}
      <Dialog open={showAllMistakes} onOpenChange={setShowAllMistakes}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              All Mistakes Analysis
            </DialogTitle>
            <DialogDescription>
              Review all mistakes across {filteredTestMarks.length} tests to identify areas for improvement
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {filteredTestMarks
              .filter(test => test.mistakes && test.mistakes.length > 0)
              .map(test => (
                <Card key={test.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{test.testName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {test.subjectName} • {test.testType} • {test.date}
                        </p>
                      </div>
                      <Badge className={getGradeColor(test.percentage)}>
                        {test.grade} ({test.percentage}%)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {test.mistakes?.map((mistake, index) => (
                        <div key={index} className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {mistake.question}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {mistake.difficulty}
                              </Badge>
                              {mistake.topic && (
                                <Badge variant="outline" className="text-xs">
                                  {mistake.topic}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-red-600 font-medium">Your Answer:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.yourAnswer}</div>
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">Correct:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.correctAnswer}</div>
                            </div>
                          </div>
                          {mistake.explanation && (
                            <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                              <span className="text-orange-600 font-medium">💡 Explanation:</span>
                              <div className="text-gray-600 dark:text-gray-400">{mistake.explanation}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {filteredTestMarks.filter(test => test.mistakes && test.mistakes.length > 0).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Mistakes Found!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Great job! You haven't made any mistakes in your tests yet.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowAllMistakes(false)}>
              Close Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
