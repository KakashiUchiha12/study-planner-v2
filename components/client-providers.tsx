"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "react-hot-toast"

// Mock session provider that doesn't import NextAuth
function MockSessionProvider({ children }: { children: ReactNode }) {
  console.log('🔧 MockSessionProvider: Rendering without NextAuth dependencies')
  return <>{children}</>
}

// Mock analytics component that doesn't import Vercel Analytics
function MockAnalytics() {
  console.log('📊 MockAnalytics: Rendering without Vercel Analytics dependencies')
  return null
}

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  console.log('🔧 ClientProviders: Rendering with mock providers')
  
  return (
    <MockSessionProvider>
      <ThemeProvider defaultTheme="system">
        {children}
        <Toaster position="top-right" />
        <MockAnalytics />
      </ThemeProvider>
    </MockSessionProvider>
  )
}
