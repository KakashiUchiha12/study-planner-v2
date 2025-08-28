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

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Subjects Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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

  describe('Loading State', () => {
    it('shows loading state while checking authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<SubjectsPage />)

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument()
    })

    it('shows loading state while fetching subjects', async () => {
      // Delay the fetch response
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => [],
      }), 100)))

      render(<SubjectsPage />)

      expect(screen.getByText('Loading subjects...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no subjects exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Ready to Organize Your Studies?')).toBeInTheDocument()
      })

      expect(screen.getByText('0 subjects')).toBeInTheDocument()
      expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()
    })
  })

  describe('Subjects Display', () => {
    it('displays subjects when they exist', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics Course',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'subject-2',
          userId: 'test-user-123',
          name: 'Physics',
          color: '#00FF00',
          description: 'Quantum Physics Course',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSubjects,
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
      })

      expect(screen.getByText('Physics')).toBeInTheDocument()
      expect(screen.getByText('Advanced Mathematics Course')).toBeInTheDocument()
      expect(screen.getByText('Quantum Physics Course')).toBeInTheDocument()
      expect(screen.getByText('2 subjects')).toBeInTheDocument()
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

      // Mock initial load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      // Mock create subject
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockNewSubject,
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()
      })

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

      // Verify the API call was made
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/subjects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Chemistry',
            color: expect.any(String),
            description: 'Organic Chemistry',
          }),
        })
      })
    })

    it('shows validation error for empty subject name', async () => {
      // Mock initial load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()
      })

      // Click add subject button
      const addButton = screen.getByText('Add Your First Subject')
      fireEvent.click(addButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Add New Subject')).toBeInTheDocument()
      })

      // Try to submit without entering a name
      const saveButton = screen.getByRole('button', { name: /add subject/i })
      fireEvent.click(saveButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Subject name is required')).toBeInTheDocument()
      })

      // Should not make API call
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only the initial load
    })
  })

  describe('Subject Search', () => {
    it('filters subjects based on search query', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          userId: 'test-user-123',
          name: 'Mathematics',
          color: '#FF0000',
          description: 'Advanced Mathematics Course',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'subject-2',
          userId: 'test-user-123',
          name: 'Physics',
          color: '#00FF00',
          description: 'Quantum Physics Course',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSubjects,
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.getByText('Physics')).toBeInTheDocument()
      })

      // Search for "Math"
      const searchInput = screen.getByPlaceholderText('Search subjects...')
      fireEvent.change(searchInput, { target: { value: 'Math' } })

      // Should only show Mathematics
      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.queryByText('Physics')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when subjects fail to load', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
      })
    })

    it('displays authentication error when user is not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Authentication required. Please log in.')).toBeInTheDocument()
      })
    })

    it('handles subject creation failure gracefully', async () => {
      // Mock initial load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      // Mock create subject failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to create subject' }),
      })

      render(<SubjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Subject')).toBeInTheDocument()
      })

      // Click add subject button
      const addButton = screen.getByText('Add Your First Subject')
      fireEvent.click(addButton)

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Add New Subject')).toBeInTheDocument()
      })

      // Fill in the form
      const nameInput = screen.getByLabelText(/subject name/i)
      fireEvent.change(nameInput, { target: { value: 'Chemistry' } })

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /add subject/i })
      fireEvent.click(saveButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication States', () => {
    it('redirects to login when user is not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<SubjectsPage />)

      // Should not show the subjects page content
      expect(screen.queryByText('My Subjects')).not.toBeInTheDocument()
      expect(screen.queryByText('Add Your First Subject')).not.toBeInTheDocument()
    })
  })
})
