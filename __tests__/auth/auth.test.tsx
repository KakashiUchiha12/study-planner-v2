import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import LoginPage from '@/app/auth/login/page'
import SignUpPage from '@/app/auth/signup/page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

const mockSignIn = require('next-auth/react').signIn

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Page', () => {
    it('should render login form without demo credentials', () => {
      render(
        <SessionProvider>
          <LoginPage />
        </SessionProvider>
      )

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      
      // Should NOT show demo credentials
      expect(screen.queryByText('Demo credentials: demo@studyplanner.com / demo123')).not.toBeInTheDocument()
    })

    it('should show error message for invalid credentials', async () => {
      mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

      render(
        <SessionProvider>
          <LoginPage />
        </SessionProvider>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Signup Page', () => {
    it('should render signup form', () => {
      render(
        <SessionProvider>
          <SignUpPage />
        </SessionProvider>
      )

      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
      render(
        <SessionProvider>
          <SignUpPage />
        </SessionProvider>
      )

      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })

    it('should validate terms agreement', async () => {
      render(
        <SessionProvider>
          <SignUpPage />
        </SessionProvider>
      )

      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please agree to the terms and conditions')).toBeInTheDocument()
      })
    })
  })
})
