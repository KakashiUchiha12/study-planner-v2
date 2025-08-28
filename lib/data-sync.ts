// Global Data Synchronization System
// This ensures all pages stay in sync when data changes

type DataUpdateEvent = 
  | 'study-session-updated'
  | 'subject-updated'
  | 'test-mark-updated'
  | 'task-updated'
  | 'chapter-updated'
  | 'all-data-refresh'

interface DataSyncListener {
  id: string
  event: DataUpdateEvent
  callback: () => void
}

class DataSyncManager {
  private listeners: DataSyncListener[] = []
  private static instance: DataSyncManager

  private constructor() {}

  public static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager()
    }
    return DataSyncManager.instance
  }

  // Subscribe to data update events
  public subscribe(event: DataUpdateEvent, callback: () => void): string {
    const id = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.listeners.push({ id, event, callback })
    return id
  }

  // Unsubscribe from events
  public unsubscribe(id: string): void {
    this.listeners = this.listeners.filter(listener => listener.id !== id)
  }

  // Notify all listeners of a data update
  public notify(event: DataUpdateEvent): void {
    console.log(`DataSync: Notifying ${event} to ${this.listeners.filter(l => l.event === event).length} listeners`)
    
    this.listeners
      .filter(listener => listener.event === event || listener.event === 'all-data-refresh')
      .forEach(listener => {
        try {
          listener.callback()
        } catch (error) {
          console.error(`DataSync: Error in listener ${listener.id}:`, error)
        }
      })
  }

  // Force refresh all data across the application
  public refreshAllData(): void {
    this.notify('all-data-refresh')
  }

  // Get listener count for debugging
  public getListenerCount(): number {
    return this.listeners.length
  }

  // Clear all listeners (useful for testing)
  public clearAllListeners(): void {
    this.listeners = []
  }
}

// Export singleton instance
export const dataSyncManager = DataSyncManager.getInstance()

// Helper functions for common data updates
export const notifyDataUpdate = {
  studySession: () => dataSyncManager.notify('study-session-updated'),
  subject: () => dataSyncManager.notify('subject-updated'),
  testMark: () => dataSyncManager.notify('test-mark-updated'),
  task: () => dataSyncManager.notify('task-updated'),
  chapter: () => dataSyncManager.notify('chapter-updated'),
  all: () => dataSyncManager.notify('all-data-refresh')
}

import { useEffect } from 'react'

// React hook for easy subscription
export const useDataSync = (event: DataUpdateEvent, callback: () => void) => {
  useEffect(() => {
    const id = dataSyncManager.subscribe(event, callback)
    return () => dataSyncManager.unsubscribe(id)
  }, [event, callback])
}
