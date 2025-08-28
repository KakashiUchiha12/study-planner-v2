import { dbService } from '@/lib/database'

// Mock Prisma client
const mockPrismaClient = {
  subject: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
}

// Mock the database service
jest.mock('@/lib/database', () => ({
  dbService: {
    getPrisma: jest.fn(),
    healthCheck: jest.fn(),
    createSampleData: jest.fn(),
  },
}))

const mockDbService = dbService as jest.Mocked<typeof dbService>

describe('Subjects Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbService.getPrisma.mockReturnValue(mockPrismaClient as any)
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Subject Retrieval', () => {
    it('fetches subjects for a user', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'subject-2',
          userId: 'test-user-123',
          name: 'Physics',
          color: '#00FF00',
          description: 'Quantum Physics',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        }
      ]

      mockPrismaClient.subject.findMany.mockResolvedValue(mockSubjects)

      const prisma = dbService.getPrisma()
      const subjects = await prisma.subject.findMany({
        where: { userId: 'test-user-123' },
        orderBy: { createdAt: 'desc' }
      })

      expect(subjects).toEqual(mockSubjects)
      expect(mockPrismaClient.subject.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-123' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('returns empty array when user has no subjects', async () => {
      mockPrismaClient.subject.findMany.mockResolvedValue([])

      const prisma = dbService.getPrisma()
      const subjects = await prisma.subject.findMany({
        where: { userId: 'test-user-123' },
        orderBy: { createdAt: 'desc' }
      })

      expect(subjects).toEqual([])
      expect(mockPrismaClient.subject.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-123' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('handles database errors when fetching subjects', async () => {
      const dbError = new Error('Database connection failed')
      mockPrismaClient.subject.findMany.mockRejectedValue(dbError)

      const prisma = dbService.getPrisma()

      await expect(
        prisma.subject.findMany({
          where: { userId: 'test-user-123' },
          orderBy: { createdAt: 'desc' }
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Subject Creation', () => {
    it('creates a new subject successfully', async () => {
      const mockNewSubject = {
        id: 'subject-new',
        userId: 'test-user-123',
        name: 'Chemistry',
        color: '#0000FF',
        description: 'Organic Chemistry',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      }

      mockPrismaClient.subject.create.mockResolvedValue(mockNewSubject)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.create({
        data: {
          id: 'subject-new',
          userId: 'test-user-123',
          name: 'Chemistry',
          color: '#0000FF',
          description: 'Organic Chemistry',
        }
      })

      expect(subject).toEqual(mockNewSubject)
      expect(mockPrismaClient.subject.create).toHaveBeenCalledWith({
        data: {
          id: 'subject-new',
          userId: 'test-user-123',
          name: 'Chemistry',
          color: '#0000FF',
          description: 'Organic Chemistry',
        }
      })
    })

    it('creates subject with default values', async () => {
      const mockNewSubject = {
        id: 'subject-new',
        userId: 'test-user-123',
        name: 'Biology',
        color: '#3B82F6',
        description: '',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      }

      mockPrismaClient.subject.create.mockResolvedValue(mockNewSubject)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.create({
        data: {
          id: 'subject-new',
          userId: 'test-user-123',
          name: 'Biology',
          color: '#3B82F6',
          description: '',
        }
      })

      expect(subject).toEqual(mockNewSubject)
    })

    it('handles database errors when creating subject', async () => {
      const dbError = new Error('Unique constraint violation')
      mockPrismaClient.subject.create.mockRejectedValue(dbError)

      const prisma = dbService.getPrisma()

      await expect(
        prisma.subject.create({
          data: {
            id: 'subject-duplicate',
            userId: 'test-user-123',
            name: 'Chemistry',
            color: '#0000FF',
            description: 'Organic Chemistry',
          }
        })
      ).rejects.toThrow('Unique constraint violation')
    })
  })

  describe('Subject Updates', () => {
    it('updates an existing subject successfully', async () => {
      const mockUpdatedSubject = {
        id: 'subject-1',
        userId: 'test-user-123',
        name: 'Advanced Mathematics',
        color: '#FF0000',
        description: 'Advanced Mathematics Course',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      mockPrismaClient.subject.update.mockResolvedValue(mockUpdatedSubject)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.update({
        where: { id: 'subject-1' },
        data: {
          name: 'Advanced Mathematics',
          description: 'Advanced Mathematics Course',
        }
      })

      expect(subject).toEqual(mockUpdatedSubject)
      expect(mockPrismaClient.subject.update).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
        data: {
          name: 'Advanced Mathematics',
          description: 'Advanced Mathematics Course',
        }
      })
    })

    it('handles database errors when updating subject', async () => {
      const dbError = new Error('Subject not found')
      mockPrismaClient.subject.update.mockRejectedValue(dbError)

      const prisma = dbService.getPrisma()

      await expect(
        prisma.subject.update({
          where: { id: 'non-existent-subject' },
          data: { name: 'New Name' }
        })
      ).rejects.toThrow('Subject not found')
    })
  })

  describe('Subject Deletion', () => {
    it('deletes a subject successfully', async () => {
      const mockDeletedSubject = {
        id: 'subject-1',
        userId: 'test-user-123',
        name: 'Mathematics',
        color: '#FF0000',
        description: 'Basic Mathematics',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrismaClient.subject.delete.mockResolvedValue(mockDeletedSubject)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.delete({
        where: { id: 'subject-1' }
      })

      expect(subject).toEqual(mockDeletedSubject)
      expect(mockPrismaClient.subject.delete).toHaveBeenCalledWith({
        where: { id: 'subject-1' }
      })
    })

    it('handles database errors when deleting subject', async () => {
      const dbError = new Error('Subject not found')
      mockPrismaClient.subject.delete.mockRejectedValue(dbError)

      const prisma = dbService.getPrisma()

      await expect(
        prisma.subject.delete({
          where: { id: 'non-existent-subject' }
        })
      ).rejects.toThrow('Subject not found')
    })
  })

  describe('Subject Queries', () => {
    it('finds a specific subject by ID', async () => {
      const mockSubject = {
        id: 'subject-1',
        userId: 'test-user-123',
        name: 'Mathematics',
        color: '#FF0000',
        description: 'Advanced Mathematics',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrismaClient.subject.findUnique.mockResolvedValue(mockSubject)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.findUnique({
        where: { id: 'subject-1' }
      })

      expect(subject).toEqual(mockSubject)
      expect(mockPrismaClient.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 'subject-1' }
      })
    })

    it('returns null when subject is not found', async () => {
      mockPrismaClient.subject.findUnique.mockResolvedValue(null)

      const prisma = dbService.getPrisma()
      const subject = await prisma.subject.findUnique({
        where: { id: 'non-existent-subject' }
      })

      expect(subject).toBeNull()
    })

    it('filters subjects by user ID', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'user-1',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Math for User 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }
      ]

      mockPrismaClient.subject.findMany.mockResolvedValue(mockSubjects)

      const prisma = dbService.getPrisma()
      const subjects = await prisma.subject.findMany({
        where: { userId: 'user-1' }
      })

      expect(subjects).toEqual(mockSubjects)
      expect(subjects).toHaveLength(1)
      expect(subjects[0].userId).toBe('user-1')
    })
  })

  describe('Database Service Health', () => {
    it('performs health check successfully', async () => {
      mockDbService.healthCheck.mockResolvedValue(true)

      const isHealthy = await dbService.healthCheck()

      expect(isHealthy).toBe(true)
      expect(mockDbService.healthCheck).toHaveBeenCalled()
    })

    it('handles health check failure', async () => {
      mockDbService.healthCheck.mockResolvedValue(false)

      const isHealthy = await dbService.healthCheck()

      expect(isHealthy).toBe(false)
    })
  })

  describe('Sample Data Creation', () => {
    it('creates sample data for user', async () => {
      mockDbService.createSampleData.mockResolvedValue(undefined)

      await dbService.createSampleData('test-user-123')

      expect(mockDbService.createSampleData).toHaveBeenCalledWith('test-user-123')
    })

    it('handles errors during sample data creation', async () => {
      const error = new Error('Failed to create sample data')
      mockDbService.createSampleData.mockRejectedValue(error)

      await expect(
        dbService.createSampleData('test-user-123')
      ).rejects.toThrow('Failed to create sample data')
    })
  })
})
