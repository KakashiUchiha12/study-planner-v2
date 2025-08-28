"use client"

import { useEffect, useRef } from "react"
import { pusherClient } from "@/lib/pusher"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface RealtimeSyncOptions {
  onDataUpdate?: (data: any) => void
  onUserJoined?: (user: any) => void
  onUserLeft?: (user: any) => void
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const { data: session } = useSession()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    // Skip if Pusher is not available or no session
    if (!pusherClient || !session?.user?.email) return

    try {
      const userId = session.user.email
      const channel = pusherClient.subscribe(`user-${userId}`)
      channelRef.current = channel

      // Listen for data updates
      channel.bind("data-updated", (data: any) => {
        options.onDataUpdate?.(data)
        toast.success("Data synchronized!")
      })

      // Listen for study session updates
      channel.bind("session-updated", (data: any) => {
        options.onDataUpdate?.(data)
      })

      // Listen for task updates
      channel.bind("task-updated", (data: any) => {
        options.onDataUpdate?.(data)
      })

      // Listen for subject updates
      channel.bind("subject-updated", (data: any) => {
        options.onDataUpdate?.(data)
      })

      return () => {
        if (channelRef.current && pusherClient) {
          pusherClient.unsubscribe(`user-${userId}`)
          channelRef.current = null
        }
      }
    } catch (error) {
      console.warn("Pusher connection failed:", error)
    }
  }, [session?.user?.email, options])

  const triggerUpdate = async (type: string, data: any) => {
    if (!session?.user?.email) return

    try {
      await fetch("/api/pusher/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: `user-${session.user.email}`,
          event: type,
          data,
        }),
      })
    } catch (error) {
      console.error("Failed to trigger realtime update:", error)
    }
  }

  // Return a safe default if Pusher is not available
  if (!pusherClient) {
    return { 
      triggerUpdate: async () => {
        console.warn("Real-time sync not available - Pusher not configured")
      }
    }
  }

  return { triggerUpdate }
}
