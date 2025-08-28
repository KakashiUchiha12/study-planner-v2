import { dbService } from './database-service'
import { TestMark, Prisma } from '@prisma/client'

export interface CreateTestMarkData {
  subjectId: string
  testName: string
  testType: string
  score: number
  maxScore: number
  testDate: Date
  notes?: string
  mistakes?: any[]
}

export interface UpdateTestMarkData {
  subjectId?: string
  testName?: string
  testType?: string
  score?: number
  maxScore?: number
  testDate?: Date
  notes?: string
  mistakes?: any[]
}

export class TestMarkService {
  private prisma = dbService.getPrisma()

  constructor() {
    // Ensure the mistakes column exists when the service is initialized
    this.ensureMistakesColumnExists().catch(console.error)
  }

  // Get all test marks for a user
  async getTestMarksByUserId(userId: string): Promise<TestMark[]> {
    try {
      const testMarks = await this.prisma.testMark.findMany({
        where: { userId: userId },
        include: {
          subject: true
        },
        orderBy: { testDate: 'desc' }
      })
      
      // Custom serializer to handle BigInt and other non-serializable types
      const serializedTestMarks = testMarks.map(testMark => ({
        ...testMark,
        // Convert any BigInt fields to regular numbers
        ...(testMark as any).order && { order: Number((testMark as any).order) }
      }))
      
      return serializedTestMarks
    } catch (error) {
      console.error('Failed to get test marks:', error)
      throw new Error('Failed to fetch test marks')
    }
  }

  // Get test marks by subject
  async getTestMarksBySubjectId(subjectId: string): Promise<TestMark[]> {
    try {
      return await this.prisma.testMark.findMany({
        where: { subjectId: subjectId },
        orderBy: { testDate: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get test marks by subject:', error)
      throw new Error('Failed to fetch test marks by subject')
    }
  }

  // Get a single test mark by ID
  async getTestMarkById(testMarkId: string): Promise<TestMark | null> {
    try {
      return await this.prisma.testMark.findUnique({
        where: { id: testMarkId },
        include: {
          subject: true
        }
      })
    } catch (error) {
      console.error('Failed to get test mark:', error)
      throw new Error('Failed to fetch test mark')
    }
  }

  // Create a new test mark
  async createTestMark(userId: string, data: CreateTestMarkData): Promise<TestMark> {
    try {
      console.log('🔍 TestMarkService.createTestMark called with:', { userId, data })
      
      const testMark = await this.prisma.testMark.create({
        data: {
          id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          subjectId: data.subjectId,
          testName: data.testName,
          testType: data.testType,
          score: data.score,
          maxScore: data.maxScore,
          testDate: data.testDate,
          notes: data.notes,
          mistakes: data.mistakes ? JSON.stringify(data.mistakes) : null
        }
      })
      
      console.log('✅ TestMarkService.createTestMark succeeded:', testMark)
      return testMark
    } catch (error) {
      console.error('❌ TestMarkService.createTestMark failed:', error)
      throw new Error('Failed to create test mark')
    }
  }

  // Update an existing test mark
  async updateTestMark(testMarkId: string, data: UpdateTestMarkData): Promise<TestMark> {
    try {
      const updateData: any = {
        subjectId: data.subjectId,
        testName: data.testName,
        testType: data.testType,
        score: data.score,
        maxScore: data.maxScore,
        testDate: data.testDate,
        notes: data.notes,
        mistakes: data.mistakes ? JSON.stringify(data.mistakes) : null,
        updatedAt: new Date()
      }

      return await this.prisma.testMark.update({
        where: { id: testMarkId },
        data: updateData
      })
    } catch (error) {
      console.error('Failed to update test mark:', error)
      throw new Error('Failed to update test mark')
    }
  }

  // Delete a test mark
  async deleteTestMark(testMarkId: string): Promise<void> {
    try {
      await this.prisma.testMark.delete({
        where: { id: testMarkId }
      })
    } catch (error) {
      console.error('Failed to delete test mark:', error)
      throw new Error('Failed to delete test mark')
    }
  }

  // Search test marks
  async searchTestMarks(userId: string, query: string): Promise<TestMark[]> {
    try {
      return await this.prisma.testMark.findMany({
        where: {
          userId: userId,
          OR: [
            { testName: { contains: query } },
            { subject: { name: { contains: query } } }
          ]
        },
        include: {
          subject: true
        },
        orderBy: { testDate: 'desc' }
      })
    } catch (error) {
      console.error('Failed to search test marks:', error)
      throw new Error('Failed to search test marks')
    }
  }

  // Get test marks by date range
  async getTestMarksByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TestMark[]> {
    try {
      return await this.prisma.testMark.findMany({
        where: {
          userId: userId,
          testDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          subject: true
        },
        orderBy: { testDate: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get test marks by date range:', error)
      throw new Error('Failed to fetch test marks by date range')
    }
  }

  // Get test marks by grade
  async getTestMarksByGrade(userId: string, grade: string): Promise<TestMark[]> {
    try {
      // Since grade doesn't exist in current schema, return empty array
      // This can be implemented later when grade field is added
      return []
    } catch (error) {
      console.error('Failed to get test marks by grade:', error)
      throw new Error('Failed to fetch test marks by grade')
    }
  }

  // Get test performance statistics
  async getTestPerformanceStatistics(userId: string): Promise<{
    totalTests: number
    averagePercentage: number
    highestPercentage: number
    lowestPercentage: number
    gradeDistribution: Record<string, number>
    subjectPerformance: { subjectId: string; subjectName: string; averagePercentage: number; testCount: number }[]
  }> {
    try {
      const testMarks = await this.prisma.testMark.findMany({
        where: { userId: userId },
        include: { subject: true }
      })

      if (testMarks.length === 0) {
        return {
          totalTests: 0,
          averagePercentage: 0,
          highestPercentage: 0,
          lowestPercentage: 0,
          gradeDistribution: {},
          subjectPerformance: []
        }
      }

      const totalTests = testMarks.length
      const totalPercentage = testMarks.reduce((sum, test) => sum + test.percentage, 0)
      const averagePercentage = Math.round(totalPercentage / totalTests)
      const highestPercentage = Math.max(...testMarks.map(test => test.percentage))
      const lowestPercentage = Math.min(...testMarks.map(test => test.percentage))

      // Grade distribution
      const gradeDistribution: Record<string, number> = {}
      testMarks.forEach(test => {
        gradeDistribution[test.grade] = (gradeDistribution[test.grade] || 0) + 1
      })

      // Subject performance
      const subjectMap = new Map<string, { totalPercentage: number; testCount: number; subjectName: string }>()
      testMarks.forEach(test => {
        const subjectId = test.subjectId
        const current = subjectMap.get(subjectId) || { totalPercentage: 0, testCount: 0, subjectName: test.subject?.name || 'Unknown' }
        
        subjectMap.set(subjectId, {
          totalPercentage: current.totalPercentage + test.percentage,
          testCount: current.testCount + 1,
          subjectName: current.subjectName
        })
      })

      const subjectPerformance = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
        subjectId,
        subjectName: data.subjectName,
        averagePercentage: Math.round(data.totalPercentage / data.testCount),
        testCount: data.testCount
      }))

      return {
        totalTests,
        averagePercentage,
        highestPercentage,
        lowestPercentage,
        gradeDistribution,
        subjectPerformance
      }
    } catch (error) {
      console.error('Failed to get test performance statistics:', error)
      throw new Error('Failed to fetch test performance statistics')
    }
  }

  // Get recent test performance trend
  async getRecentTestPerformanceTrend(userId: string, days: number = 30): Promise<{
    date: string
    averagePercentage: number
    testCount: number
  }[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const testMarks = await this.prisma.testMark.findMany({
        where: {
          userId: userId,
          testDate: { gte: cutoffDate }
        },
        orderBy: { testDate: 'asc' }
      })

      // Group by date and calculate daily averages
      const dailyMap = new Map<string, { totalPercentage: number; testCount: number }>()
      
      testMarks.forEach(test => {
        const dateKey = test.testDate.toISOString().split('T')[0]
        const current = dailyMap.get(dateKey) || { totalPercentage: 0, testCount: 0 }
        
        dailyMap.set(dateKey, {
          totalPercentage: current.totalPercentage + test.percentage,
          testCount: current.testCount + 1
        })
      })

      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        averagePercentage: Math.round(data.totalPercentage / data.testCount),
        testCount: data.testCount
      }))
    } catch (error) {
      console.error('Failed to get recent test performance trend:', error)
      throw new Error('Failed to fetch recent test performance trend')
    }
  }

  // Calculate grade based on percentage
  private calculateGrade(percentage: number): string {
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

  // Ensure the mistakes column exists in the database
  async ensureMistakesColumnExists(): Promise<void> {
    try {
      // Try to add the mistakes column if it doesn't exist
      await this.prisma.$executeRaw`ALTER TABLE TestMark ADD COLUMN mistakes TEXT`
      console.log('✅ Mistakes column added successfully')
    } catch (error: any) {
      // If column already exists, this is fine
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log('ℹ️ Mistakes column already exists')
      } else {
        console.error('❌ Failed to add mistakes column:', error)
      }
    }
  }
}

// Export singleton instance
export const testMarkService = new TestMarkService()
