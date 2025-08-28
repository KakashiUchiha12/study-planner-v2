"use client"

import { toast } from "react-hot-toast"

export interface StudyNotification {
  id: string
  type: "reminder" | "achievement" | "deadline" | "goal"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

class NotificationManager {
  private subscribers: ((notifications: StudyNotification[]) => void)[] = []
  private notifications: StudyNotification[] = []
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.requestPermission()
    }
  }

  private async requestPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  // Initialize notifications from database (call this once on app startup)
  async initialize() {
    if (this.initialized) return
    
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        this.notifications = data.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        this.notifySubscribers()
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
    
    this.initialized = true
  }

  private async saveNotification(notification: Omit<StudyNotification, "id" | "timestamp" | "read">) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
      
      if (response.ok) {
        const savedNotification = await response.json()
        this.notifications.unshift({
          ...savedNotification,
          timestamp: new Date(savedNotification.timestamp)
        })
        this.notifySubscribers()
        return savedNotification
      }
    } catch (error) {
      console.error('Failed to save notification:', error)
    }
    return null
  }

  private async updateNotification(id: string, updates: Partial<StudyNotification>) {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        const updatedNotification = await response.json()
        this.notifications = this.notifications.map(n => 
          n.id === id ? { ...n, ...updatedNotification, timestamp: new Date(updatedNotification.timestamp) } : n
        )
        this.notifySubscribers()
        return updatedNotification
      }
    } catch (error) {
      console.error('Failed to update notification:', error)
    }
    return null
  }

  private async deleteNotification(id: string) {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        this.notifications = this.notifications.filter(n => n.id !== id)
        this.notifySubscribers()
        return true
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
    return false
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.notifications]))
  }

  subscribe(callback: (notifications: StudyNotification[]) => void) {
    this.subscribers.push(callback)
    
    // Initialize if not already done
    if (!this.initialized) {
      this.initialize()
    }
    
    // Return current notifications immediately
    callback([...this.notifications])
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  async addNotification(notification: Omit<StudyNotification, "id" | "timestamp" | "read">) {
    // Check if this notification already exists to prevent duplicates
    const existingNotification = this.notifications.find(n => 
      n.type === notification.type && 
      n.title === notification.title && 
      n.message === notification.message &&
      !n.read
    )
    
    if (existingNotification) {
      console.log('Notification already exists, skipping duplicate:', notification.title)
      return existingNotification
    }

    const savedNotification = await this.saveNotification(notification)
    
    if (savedNotification) {
      // Show toast notification
      toast(notification.message, {
        duration: 5000,
        icon: this.getNotificationIcon(notification.type)
      })

      // Show browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/placeholder-logo.png"
        })
      }
    }
    
    return savedNotification
  }

  async markAsRead(id: string) {
    await this.updateNotification(id, { read: true })
  }

  async markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      })
      
      if (response.ok) {
        this.notifications.forEach(n => n.read = true)
        this.notifySubscribers()
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  async removeNotification(id: string) {
    await this.deleteNotification(id)
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  private getNotificationIcon(type: StudyNotification["type"]): string {
    switch (type) {
      case "reminder": return "⏰"
      case "achievement": return "🎉"
      case "deadline": return "⚠️"
      case "goal": return "🎯"
      default: return "📚"
    }
  }

  // Study-specific notification methods (now properly managed)
  async scheduleStudyReminder(subject: string, time: Date) {
    const now = new Date()
    const timeUntilReminder = time.getTime() - now.getTime()

    if (timeUntilReminder > 0) {
      setTimeout(async () => {
        await this.addNotification({
          type: "reminder",
          title: "Study Reminder",
          message: `Time to study ${subject}!`,
          actionUrl: "/study-sessions"
        })
      }, timeUntilReminder)
    }
  }

  async notifyTaskDeadline(taskTitle: string, dueDate: Date) {
    const now = new Date()
    const timeUntilDeadline = dueDate.getTime() - now.getTime()
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60)

    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      await this.addNotification({
        type: "deadline",
        title: "Task Deadline Approaching",
        message: `"${taskTitle}" is due in ${Math.round(hoursUntilDeadline)} hours!`,
        actionUrl: "/dashboard"
      })
    }
  }

  async notifyStudyGoalAchieved(goalType: string, target: number) {
    await this.addNotification({
      type: "achievement",
      title: "Goal Achieved! 🎉",
      message: `Congratulations! You've reached your ${goalType} study goal of ${target} minutes!`,
      actionUrl: "/analytics"
    })
  }

  async notifyStudyStreak(days: number) {
    await this.addNotification({
      type: "achievement",
      title: "Study Streak! 🔥",
      message: `Amazing! You've maintained a ${days}-day study streak!`,
      actionUrl: "/dashboard"
    })
  }

  async notifyTestScoreImprovement(subject: string, improvement: number) {
    await this.addNotification({
      type: "achievement",
      title: "Score Improvement!",
      message: `Your ${subject} test score improved by ${improvement}%!`,
      actionUrl: "/test-marks"
    })
  }

  // Remove the automatic notification creation on page load
  // This was causing duplicate notifications
}

export const notificationManager = new NotificationManager()
