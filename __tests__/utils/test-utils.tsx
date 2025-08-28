import React, { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper function to create mock data
export const createMockTask = (overrides = {}) => ({
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  createdAt: new Date(),
  dueDate: new Date('2024-12-31'),
  priority: 'high' as const,
  category: 'Study',
  estimatedTime: 60,
  tags: [],
  subject: 'Math',
  progress: 0,
  timeSpent: 0,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  university: 'Test University',
  program: 'Computer Science',
  year: 3,
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  badges: ['First Task', 'Study Streak'],
  isPrivate: false,
  studyGoal: 4,
  currentStreak: 5,
  totalStudyTime: 1200,
  ...overrides,
})

export const createMockStudySession = (overrides = {}) => ({
  id: '1',
  subject: 'Mathematics',
  duration: 120,
  date: new Date(),
  notes: 'Worked on calculus problems',
  sessionType: 'Focused Study' as const,
  productivity: 4,
  topicsCovered: ['Calculus', 'Derivatives'],
  materialsUsed: ['Textbook', 'Calculator'],
  ...overrides,
})

export const createMockSubject = (overrides = {}) => ({
  id: '1',
  name: 'Mathematics',
  description: 'Advanced mathematics course',
  credits: 3,
  color: '#3B82F6',
  instructor: 'Dr. Smith',
  semester: 'Fall 2024',
  grade: 'A-',
  progress: 75,
  ...overrides,
})

// Helper function to mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// Helper function to wait for async operations
export const waitForAsync = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
