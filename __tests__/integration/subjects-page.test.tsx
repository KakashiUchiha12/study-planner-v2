import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import SubjectsPage from '@/app/subjects/page'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock the useSubjects hook
jest.mock('@/hooks/useSubjects', () => ({
  useSubjects: jest.fn(),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Import the mocked hook
import { useSubjects } from '@/hooks/useSubjects'
const mockUseSubjects = useSubjects as jest.MockedFunction<typeof useSubjects>

describe('Subjects Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful session by default
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated',
      update: jest.fn()
    })

    // Mock useSubjects hook by default
    mockUseSubjects.mockReturnValue({
      subjects: [],
      loading: false,
      error: null,
      createSubject: jest.fn(),
      updateSubject: jest.fn(),
      deleteSubject: jest.fn(),
      searchSubjects: jest.fn(),
      getSubjectsWithTaskCounts: jest.fn(),
      refreshSubjects: jest.fn(),
    })
  })

  describe('Loading State', () => {
    it('shows loading state while checking authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument()
    })

    it('shows loading state while fetching subjects', () => {
      mockUseSubjects.mockReturnValue({
        subjects: [],
        loading: true,
        error: null,
        createSubject: jest.fn(),
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Loading subjects...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no subjects exist', () => {
      mockUseSubjects.mockReturnValue({
        subjects: [],
        loading: false,
        error: null,
        createSubject: jest.fn(),
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Ready to Organize Your Studies?')).toBeInTheDocument()
      expect(screen.getByText('0 subjects')).toBeInTheDocument()
      expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()
    })
  })

  describe('Subjects Display', () => {
    it('displays subjects when they exist', () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics Course',
          code: 'MATH101',
          credits: 3,
          instructor: 'Dr. Smith',
          totalChapters: 10,
          completedChapters: 5,
          progress: 50,
          assignmentsDue: 2,
          nextExam: null,
          order: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'subject-2',
          userId: 'test-user-123',
          name: 'Physics',
          color: '#00FF00',
          description: 'Quantum Physics Course',
          code: 'PHYS101',
          credits: 4,
          instructor: 'Dr. Johnson',
          totalChapters: 12,
          completedChapters: 6,
          progress: 50,
          assignmentsDue: 1,
          nextExam: null,
          order: 1,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        }
      ]

      mockUseSubjects.mockReturnValue({
        subjects: mockSubjects,
        loading: false,
        error: null,
        createSubject: jest.fn(),
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      expect(screen.getByText('Physics')).toBeInTheDocument()
      expect(screen.getByText('Advanced Mathematics Course')).toBeInTheDocument()
      expect(screen.getByText('Quantum Physics Course')).toBeInTheDocument()
      expect(screen.getByText('2 subjects')).toBeInTheDocument()
    })
  })

  describe('Subject Creation', () => {
    it('creates a new subject successfully', async () => {
      const mockCreateSubject = jest.fn()
      
      mockUseSubjects.mockReturnValue({
        subjects: [],
        loading: false,
        error: null,
        createSubject: mockCreateSubject,
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()

      // Click add subject button
      const addButton = screen.getByText('Add Your First Subject')
      fireEvent.click(addButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Add New Subject')).toBeInTheDocument()
      })

      // Fill in the form
      const nameInput = screen.getByLabelText(/subject name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      
      fireEvent.change(nameInput, { target: { value: 'Chemistry' } })
      fireEvent.change(descriptionInput, { target: { value: 'Organic Chemistry' } })

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /add subject/i })
      fireEvent.click(saveButton)

      // Verify the createSubject function was called
      await waitFor(() => {
        expect(mockCreateSubject).toHaveBeenCalledWith({
          name: 'Chemistry',
          color: expect.any(String),
          description: 'Organic Chemistry',
          code: '',
          credits: 3,
          instructor: '',
          totalChapters: 0,
          completedChapters: 0,
          progress: 0,
          assignmentsDue: 0,
          nextExam: null,
        })
      })
    })
  })

  describe('Subject Search', () => {
    it('filters subjects based on search query', () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics Course',
          code: 'MATH101',
          credits: 3,
          instructor: 'Dr. Smith',
          totalChapters: 10,
          completedChapters: 5,
          progress: 50,
          assignmentsDue: 2,
          nextExam: null,
          order: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'subject-2',
          userId: 'test-user-123',
          name: 'Physics',
          color: '#00FF00',
          description: 'Quantum Physics Course',
          code: 'PHYS101',
          credits: 4,
          instructor: 'Dr. Johnson',
          totalChapters: 12,
          completedChapters: 6,
          progress: 50,
          assignmentsDue: 1,
          nextExam: null,
          order: 1,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        }
      ]

      mockUseSubjects.mockReturnValue({
        subjects: mockSubjects,
        loading: false,
        error: null,
        createSubject: jest.fn(),
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      // Search for "Math"
      const searchInput = screen.getByPlaceholderText('Search subjects...')
      fireEvent.change(searchInput, { target: { value: 'Math' } })

      // Should still show Mathematics
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      // Physics should not be visible due to search filter
      expect(screen.queryByText('Physics')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when subjects fail to load', () => {
      mockUseSubjects.mockReturnValue({
        subjects: [],
        loading: false,
        error: 'Failed to load subjects',
        createSubject: jest.fn(),
        updateSubject: jest.fn(),
        deleteSubject: jest.fn(),
        searchSubjects: jest.fn(),
        getSubjectsWithTaskCounts: jest.fn(),
        refreshSubjects: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Failed to load subjects')).toBeInTheDocument()
    })
  })

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })

      const mockPush = jest.fn()
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      })

      render(<SubjectsPage />)

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })
})
