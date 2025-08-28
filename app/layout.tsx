import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "react-hot-toast"
import { Analytics } from "@vercel/analytics/next"



export const metadata: Metadata = {
  title: "StudyPlanner - Organize Your Academic Success",
  description:
    "A comprehensive study planner app for students to track subjects, syllabus, test marks, and study sessions.",
  generator: "v0.app",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PDF.js will be loaded dynamically when needed */}
      </head>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          <ThemeProvider defaultTheme="system">
            {children}
            <Toaster position="top-right" />
            <Analytics />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
