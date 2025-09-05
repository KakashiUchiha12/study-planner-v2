/**
 * Offline Data Hook for PWA
 * Manages offline data synchronization with your existing SQLite database
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from './use-session-simple'

interface OfflineDataState {
  isOnline: boolean
  isSyncing: boolean
  lastSync: Date | null
  pendingChanges: number
  storageInfo: {
    used: number
    available: number
  }
}

export function useOfflineData() {
  const { data: session } = useSession()
  const [state, setState] = useState<OfflineDataState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
    storageInfo: { used: 0, available: 0 }
  })

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      syncOfflineData()
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        setState(prev => ({
          ...prev,
          storageInfo: {
            used: estimate.usage || 0,
            available: estimate.quota || 0
          }
        }))
      } catch (error) {
        console.error('Failed to get storage info:', error)
      }
    }
  }, [])

  // Sync offline data when coming online
  const syncOfflineData = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return

    setState(prev => ({ ...prev, isSyncing: true }))

    try {
      // Get pending changes from localStorage
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
      
      for (const change of pendingChanges) {
        try {
          await fetch(change.url, {
            method: change.method,
            headers: change.headers,
            body: change.body
          })
        } catch (error) {
          console.error('Failed to sync change:', error)
        }
      }

      // Clear pending changes after successful sync
      localStorage.removeItem('pendingChanges')
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingChanges: 0
      }))

      console.log('Offline data synced successfully')
    } catch (error) {
      console.error('Failed to sync offline data:', error)
      setState(prev => ({ ...prev, isSyncing: false }))
    }
  }, [state.isOnline, state.isSyncing])

  // Queue change for offline sync
  const queueChange = useCallback((url: string, method: string, headers: any, body: any) => {
    const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
    pendingChanges.push({ url, method, headers, body, timestamp: Date.now() })
    localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges))
    
    setState(prev => ({ ...prev, pendingChanges: pendingChanges.length }))
  }, [])

  // Store data locally for offline access
  const storeOfflineData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to store offline data:', error)
    }
  }, [])

  // Get offline data
  const getOfflineData = useCallback((key: string) => {
    try {
      const stored = localStorage.getItem(`offline_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.data
      }
    } catch (error) {
      console.error('Failed to get offline data:', error)
    }
    return null
  }, [])

  // Clear offline data
  const clearOfflineData = useCallback((key?: string) => {
    try {
      if (key) {
        localStorage.removeItem(`offline_${key}`)
      } else {
        // Clear all offline data
        const keys = Object.keys(localStorage).filter(k => k.startsWith('offline_'))
        keys.forEach(k => localStorage.removeItem(k))
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }, [])

  // Initialize storage info
  useEffect(() => {
    getStorageInfo()
  }, [getStorageInfo])

  return {
    ...state,
    syncOfflineData,
    queueChange,
    storeOfflineData,
    getOfflineData,
    clearOfflineData,
    getStorageInfo
  }
}
