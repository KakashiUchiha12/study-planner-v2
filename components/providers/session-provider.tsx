"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export function AuthSessionProvider({ children, session }: SessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
