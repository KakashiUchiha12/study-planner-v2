import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSubjects } from '@/hooks/useSubjects'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockPush = jest.fn()

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useSubjects Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })

    // Mock successful session by default
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    })
  })

  describe('Loading Subjects', () => {
    it('loads subjects successfully on mount', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSubjects,
      })

      const { result } = renderHook(() => useSubjects())

      // Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.subjects).toEqual([])
      expect(result.current.error).toBe(null)

      // Wait for subjects to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toEqual(mockSubjects)
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenCalledWith('/api/subjects')
    })

    it('handles authentication error when loading subjects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toEqual([])
      expect(result.current.error).toBe('Authentication required. Please log in.')
    })

    it('handles server error when loading subjects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toEqual([])
      expect(result.current.error).toBe('Server error. Please try again later.')
    })

    it('does not load subjects when user is not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('waits for session to load before fetching subjects', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      const { result } = renderHook(() => useSubjects())

      // Should not fetch while session is loading
      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Creating Subjects', () => {
    it('creates a subject successfully', async () => {
      const mockNewSubject = {
        id: 'subject-new',
        userId: 'test-user-123',
        name: 'Chemistry',
        color: '#0000FF',
        description: 'Organic Chemistry',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      }

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      // Mock create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockNewSubject,
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createdSubject
      await act(async () => {
        createdSubject = await result.current.createSubject({
          name: 'Chemistry',
          color: '#0000FF',
          description: 'Organic Chemistry',
        })
      })

      expect(createdSubject).toEqual(mockNewSubject)
      expect(result.current.subjects).toContainEqual(mockNewSubject)
      expect(mockFetch).toHaveBeenCalledWith('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Chemistry',
          color: '#0000FF',
          description: 'Organic Chemistry',
        }),
      })
    })

    it('handles authentication error when creating subject', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      // Mock create with auth error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.createSubject({
            name: 'Chemistry',
            color: '#0000FF',
          })
        } catch (error) {
          expect(error.message).toBe('Authentication required. Please log in.')
        }
      })

      expect(result.current.error).toBe('Authentication required. Please log in.')
    })

    it('throws error when user is not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.createSubject({
            name: 'Chemistry',
            color: '#0000FF',
          })
        } catch (error) {
          expect(error.message).toBe('User not authenticated')
        }
      })
    })
  })

  describe('Updating Subjects', () => {
    it('updates a subject successfully', async () => {
      const initialSubject = {
        id: 'subject-1',
        userId: 'test-user-123',
        name: 'Mathematics',
        color: '#FF0000',
        description: 'Basic Mathematics',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const updatedSubject = {
        ...initialSubject,
        name: 'Advanced Mathematics',
        description: 'Advanced Mathematics Course',
        updatedAt: new Date('2024-01-02'),
      }

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [initialSubject],
      })

      // Mock update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedSubject,
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resultSubject
      await act(async () => {
        resultSubject = await result.current.updateSubject('subject-1', {
          name: 'Advanced Mathematics',
          description: 'Advanced Mathematics Course',
        })
      })

      expect(resultSubject).toEqual(updatedSubject)
      expect(result.current.subjects[0]).toEqual(updatedSubject)
      expect(mockFetch).toHaveBeenCalledWith('/api/subjects/subject-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Advanced Mathematics',
          description: 'Advanced Mathematics Course',
        }),
      })
    })
  })

  describe('Deleting Subjects', () => {
    it('deletes a subject successfully', async () => {
      const subjectToDelete = {
        id: 'subject-1',
        userId: 'test-user-123',
        name: 'Mathematics',
        color: '#FF0000',
        description: 'Basic Mathematics',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [subjectToDelete],
      })

      // Mock delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toHaveLength(1)

      await act(async () => {
        await result.current.deleteSubject('subject-1')
      })

      expect(result.current.subjects).toHaveLength(0)
      expect(mockFetch).toHaveBeenCalledWith('/api/subjects/subject-1', {
        method: 'DELETE',
      })
    })
  })

  describe('Searching Subjects', () => {
    it('searches subjects locally', async () => {
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

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSubjects,
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let searchResults
      await act(async () => {
        searchResults = await result.current.searchSubjects('Math')
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].name).toBe('Mathematics')
    })

    it('returns empty array for empty search query', async () => {
      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let searchResults
      await act(async () => {
        searchResults = await result.current.searchSubjects('')
      })

      expect(searchResults).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('clears error after 5 seconds', async () => {
      jest.useFakeTimers()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.error).toBe('Server error. Please try again later.')
      })

      // Fast-forward time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(result.current.error).toBe(null)
      })

      jest.useRealTimers()
    })
  })

  describe('Refresh Functionality', () => {
    it('refreshes subjects when refreshSubjects is called', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }
      ]

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      // Mock refresh load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSubjects,
      })

      const { result } = renderHook(() => useSubjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subjects).toEqual([])

      await act(async () => {
        await result.current.refreshSubjects()
      })

      expect(result.current.subjects).toEqual(mockSubjects)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
