import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { TestMark } from '@prisma/client'

export function useTestMarks() {
  const { data: session } = useSession()
  const [testMarks, setTestMarks] = useState<TestMark[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user ID from session
  const userId = session?.user?.id || 'demo-user-1'

  // Load test marks from API
  const loadTestMarks = useCallback(async (filters?: {
    subjectId?: string
    testType?: string
    startDate?: string
    endDate?: string
  }) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters?.subjectId && filters.subjectId !== 'all') {
        params.append('subjectId', filters.subjectId)
      }
      if (filters?.testType && filters.testType !== 'all') {
        params.append('testType', filters.testType)
      }
      if (filters?.startDate && filters?.endDate) {
        params.append('startDate', filters.startDate)
        params.append('endDate', filters.endDate)
      }

      const url = `/api/test-marks${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch test marks')
      }
      
      const data = await response.json()
      setTestMarks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test marks')
      console.error('Failed to load test marks:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create a new test mark
  const createTestMark = useCallback(async (testData: {
    subjectId: string
    testName: string
    testType: string
    score: number
    maxScore: number
    testDate: string
    notes?: string
  }) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch('/api/test-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create test mark')
      }
      
      const newTestMark = await response.json()
      setTestMarks(prev => [newTestMark, ...prev])
      return newTestMark
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create test mark'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update an existing test mark
  const updateTestMark = useCallback(async (testId: string, updates: {
    subjectId?: string
    testName?: string
    testType?: string
    score?: number
    maxScore?: number
    testDate?: string
    notes?: string
  }) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch(`/api/test-marks/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update test mark')
      }
      
      const updatedTestMark = await response.json()
      setTestMarks(prev => prev.map(testMark => 
        testMark.id === testId ? updatedTestMark : testMark
      ))
      return updatedTestMark
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test mark'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Delete a test mark
  const deleteTestMark = useCallback(async (testId: string) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const response = await fetch(`/api/test-marks/${testId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete test mark')
      }
      
      setTestMarks(prev => prev.filter(testMark => testMark.id !== testId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete test mark'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Get test marks by subject
  const getTestMarksBySubject = useCallback(async (subjectId: string) => {
    if (!userId) return []

    try {
      setError(null)
      return testMarks.filter(testMark => testMark.subjectId === subjectId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get test marks by subject'
      setError(errorMessage)
      return []
    }
  }, [userId, testMarks])

  // Get test marks by date range
  const getTestMarksByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!userId) return []

    try {
      setError(null)
      return testMarks.filter(testMark => {
        const testDate = new Date(testMark.testDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return testDate >= start && testDate <= end
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get test marks by date range'
      setError(errorMessage)
      return []
    }
  }, [userId, testMarks])

  // Get test marks by grade
  const getTestMarksByGrade = useCallback(async (grade: string) => {
    if (!userId) return []

    try {
      setError(null)
      return testMarks.filter(testMark => {
        const percentage = (testMark.score / testMark.maxScore) * 100
        const testGrade = getGradeFromPercentage(percentage)
        return testGrade === grade
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get test marks by grade'
      setError(errorMessage)
      return []
    }
  }, [userId, testMarks])

  // Search test marks
  const searchTestMarks = useCallback(async (query: string) => {
    if (!userId || !query.trim()) return []

    try {
      setError(null)
      // For now, filter locally since we have all test marks loaded
      return testMarks.filter(testMark => {
        const testName = testMark.testName || ''
        const notes = testMark.notes || ''
        return (
          testName.toLowerCase().includes(query.toLowerCase()) ||
          notes.toLowerCase().includes(query.toLowerCase())
        )
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search test marks'
      setError(errorMessage)
      return []
    }
  }, [userId, testMarks])

  // Get performance statistics
  const getPerformanceStatistics = useCallback(async () => {
    if (!userId) return null

    try {
      setError(null)
      const totalTests = testMarks.length
      if (totalTests === 0) return null

      const totalScore = testMarks.reduce((sum, test) => sum + test.score, 0)
      const totalMaxScore = testMarks.reduce((sum, test) => sum + test.maxScore, 0)
      const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

      const gradeDistribution = testMarks.reduce((acc, test) => {
        const percentage = (test.score / test.maxScore) * 100
        const grade = getGradeFromPercentage(percentage)
        acc[grade] = (acc[grade] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalTests,
        averagePercentage,
        gradeDistribution,
        totalScore,
        totalMaxScore
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get performance statistics'
      setError(errorMessage)
      return null
    }
  }, [userId, testMarks])

  // Get performance trends
  const getPerformanceTrends = useCallback(async (days: number = 30) => {
    if (!userId) return []

    try {
      setError(null)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const recentTests = testMarks.filter(testMark => 
        new Date(testMark.testDate) >= cutoffDate
      )

      // Sort by date and calculate trends
      const sortedTests = recentTests.sort((a, b) => 
        new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
      )

      return sortedTests.map(testMark => ({
        date: testMark.testDate,
        percentage: (testMark.score / testMark.maxScore) * 100,
        grade: getGradeFromPercentage((testMark.score / testMark.maxScore) * 100)
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get performance trends'
      setError(errorMessage)
      return []
    }
  }, [userId, testMarks])

  // Helper function to get grade from percentage
  const getGradeFromPercentage = (percentage: number): string => {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 63) return 'D'
    if (percentage >= 60) return 'D-'
    return 'F'
  }

  // Refresh test marks
  const refreshTestMarks = useCallback(() => {
    loadTestMarks()
  }, [loadTestMarks])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Load test marks on mount and when user changes
  useEffect(() => {
    loadTestMarks()
  }, [loadTestMarks])

  return {
    testMarks,
    loading,
    error,
    createTestMark,
    updateTestMark,
    deleteTestMark,
    getTestMarksBySubject,
    getTestMarksByDateRange,
    getTestMarksByGrade,
    searchTestMarks,
    getPerformanceStatistics,
    getPerformanceTrends,
    refreshTestMarks
  }
}
