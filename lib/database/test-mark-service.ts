import { dbService } from './database-service'
import { TestMark } from '@prisma/client'

interface TestMarkStatistics {
  totalTests: number
  averageScore: number
  highestScore: number
  lowestScore: number
  scoreDistribution: Record<string, number>
  totalPercentage: number
}

interface TestMarkTrend {
  date: Date
  averageScore: number
  totalTests: number
}

interface MistakeData {
  question: string
  correctAnswer: string
  userAnswer: string
  explanation?: string
}

export interface CreateTestMarkData {
  subjectId: string
  testName: string
  testType: string
  score: number
  maxScore: number
  testDate: Date
  notes?: string
  mistakes?: MistakeData[]
}

export interface UpdateTestMarkData {
  subjectId?: string
  testName?: string
  testType?: string
  score?: number
  maxScore?: number
  testDate?: Date
  notes?: string
  mistakes?: MistakeData[]
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
        ...(testMark as unknown as { order?: bigint }).order && { order: Number((testMark as unknown as { order: bigint }).order) }
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
      const updateData: Record<string, unknown> = {
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



  // Ensure the mistakes column exists in the database
  async ensureMistakesColumnExists(): Promise<void> {
    try {
      // Try to add the mistakes column if it doesn't exist
      await this.prisma.$executeRaw`ALTER TABLE TestMark ADD COLUMN mistakes TEXT`
      console.log('✅ Mistakes column added successfully')
    } catch (error: unknown) {
      // If column already exists, this is fine
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('duplicate column name') || errorMessage.includes('already exists')) {
        console.log('ℹ️ Mistakes column already exists')
      } else {
        console.error('❌ Failed to add mistakes column:', error)
      }
    }
  }

  async getTestMarkStatistics(userId: string, subjectId?: string): Promise<TestMarkStatistics> {
    try {
      const whereClause: { userId: string; subjectId?: string } = { userId }
      if (subjectId) {
        whereClause.subjectId = subjectId
      }

      const testMarks = await this.prisma.testMark.findMany({
        where: whereClause,
        include: { subject: true }
      })

      if (testMarks.length === 0) {
        return {
          totalTests: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          scoreDistribution: {},
          totalPercentage: 0
        }
      }

      // Calculate statistics based on score/maxScore
      const totalPercentage = testMarks.reduce((sum, test) => sum + (test.score / test.maxScore * 100), 0)
      const averagePercentage = totalPercentage / testMarks.length
      const highestPercentage = Math.max(...testMarks.map(test => test.score / test.maxScore * 100))
      const lowestPercentage = Math.min(...testMarks.map(test => test.score / test.maxScore * 100))

      // Group by score ranges
      const scoreDistribution: Record<string, number> = {}
      testMarks.forEach(test => {
        const percentage = Math.round((test.score / test.maxScore) * 100)
        const range = this.getScoreRange(percentage)
        scoreDistribution[range] = (scoreDistribution[range] || 0) + 1
      })

      return {
        totalTests: testMarks.length,
        averageScore: Math.round(averagePercentage),
        highestScore: Math.round(highestPercentage),
        lowestScore: Math.round(lowestPercentage),
        scoreDistribution,
        totalPercentage: Math.round(totalPercentage)
      }
    } catch (error) {
      console.error('Error getting test mark statistics:', error)
      throw new Error('Failed to get test mark statistics')
    }
  }

  private getScoreRange(percentage: number): string {
    if (percentage >= 90) return '90-100%'
    if (percentage >= 80) return '80-89%'
    if (percentage >= 70) return '70-79%'
    if (percentage >= 60) return '60-69%'
    if (percentage >= 50) return '50-59%'
    return 'Below 50%'
  }

  async getTestMarkTrends(userId: string, subjectId?: string, _days: number = 30): Promise<TestMarkTrend[]> {
    try {
      const whereClause: { userId: string; subjectId?: string } = { userId }
      if (subjectId) {
        whereClause.subjectId = subjectId
      }

      const testMarks = await this.prisma.testMark.findMany({
        where: whereClause,
        orderBy: { testDate: 'asc' }
      })

      if (testMarks.length === 0) {
        return []
      }

      // Group by date and calculate average
      const trends: TestMarkTrend[] = []
      const groupedByDate = testMarks.reduce((acc, test) => {
        const date = test.testDate.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(test)
        return acc
      }, {} as Record<string, typeof testMarks>)

      Object.entries(groupedByDate).forEach(([date, tests]) => {
        const totalPercentage = tests.reduce((sum, test) => sum + (test.score / test.maxScore * 100), 0)
        const averagePercentage = totalPercentage / tests.length

        trends.push({
          date: new Date(date),
          averageScore: Math.round(averagePercentage),
          totalTests: tests.length
        })
      })

      return trends
    } catch (error) {
      console.error('Error getting test mark trends:', error)
      throw new Error('Failed to get test mark trends')
    }
  }
}

// Export singleton instance
export const testMarkService = new TestMarkService()
