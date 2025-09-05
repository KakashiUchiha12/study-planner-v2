/**
 * Offline Status Component
 * Shows online/offline status and sync information
 */

import { useOfflineData } from '@/hooks/useOfflineData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface OfflineStatusProps {
  className?: string
  showDetails?: boolean
}

export function OfflineStatus({ className = '', showDetails = false }: OfflineStatusProps) {
  const { isOnline, isSyncing, lastSync, pendingChanges, syncOfflineData } = useOfflineData()
  const [showSyncDetails, setShowSyncDetails] = useState(false)

  if (isOnline && !showDetails) {
    return null // Don't show anything when online unless details are requested
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Icon */}
      {isOnline ? (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <Wifi className="h-4 w-4" />
          <span className="text-xs font-medium">Online</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}

      {/* Pending Changes Badge */}
      {pendingChanges > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingChanges} pending
        </Badge>
      )}

      {/* Sync Button */}
      {!isOnline && pendingChanges > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncOfflineData}
          disabled={isSyncing}
          className="h-6 px-2 text-xs"
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Last Sync Info */}
      {showDetails && lastSync && (
        <div className="flex items-center space-x-1 text-muted-foreground">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Sync Details Toggle */}
      {showDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSyncDetails(!showSyncDetails)}
          className="h-6 px-2 text-xs"
        >
          {showSyncDetails ? 'Hide' : 'Details'}
        </Button>
      )}

      {/* Sync Details */}
      {showSyncDetails && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-card border border-border rounded-md shadow-lg z-50 min-w-64">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={isOnline ? 'text-green-600' : 'text-amber-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Changes:</span>
              <span>{pendingChanges}</span>
            </div>
            {lastSync && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sync:</span>
                <span>{lastSync.toLocaleString()}</span>
              </div>
            )}
            {isSyncing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
