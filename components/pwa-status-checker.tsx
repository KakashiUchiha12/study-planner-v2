/**
 * PWA Status Checker Component
 * Shows PWA installation status and requirements
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

interface PWAStatus {
  hasManifest: boolean
  hasServiceWorker: boolean
  isHTTPS: boolean
  isStandalone: boolean
  canInstall: boolean
  manifestData?: any
  serviceWorkerStatus?: string
}

export function PWAStatusChecker() {
  const [status, setStatus] = useState<PWAStatus>({
    hasManifest: false,
    hasServiceWorker: false,
    isHTTPS: false,
    isStandalone: false,
    canInstall: false
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const checkPWAStatus = async () => {
      const newStatus: PWAStatus = {
        hasManifest: false,
        hasServiceWorker: false,
        isHTTPS: false,
        isStandalone: false,
        canInstall: false
      }

      // Check HTTPS
      newStatus.isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost'

      // Check if running in standalone mode
      newStatus.isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Check manifest
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]')
        if (manifestLink) {
          const manifestUrl = manifestLink.getAttribute('href')
          if (manifestUrl) {
            const response = await fetch(manifestUrl)
            if (response.ok) {
              newStatus.manifestData = await response.json()
              newStatus.hasManifest = true
            }
          }
        }
      } catch (error) {
        console.error('Error checking manifest:', error)
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            newStatus.hasServiceWorker = true
            newStatus.serviceWorkerStatus = registration.active ? 'active' : 'installing'
          }
        } catch (error) {
          console.error('Error checking service worker:', error)
        }
      }

      // Check if can install
      newStatus.canInstall = newStatus.hasManifest && newStatus.hasServiceWorker && newStatus.isHTTPS

      setStatus(newStatus)
    }

    checkPWAStatus()
  }, [])

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusBadge = (condition: boolean) => {
    return condition ? (
      <Badge variant="default" className="bg-green-600">Pass</Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>PWA Status Checker</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PWA Ready</span>
              {getStatusIcon(status.canInstall)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Installed</span>
              {getStatusIcon(status.isStandalone)}
            </div>
          </div>

          {/* Detailed Status */}
          {showDetails && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.isHTTPS)}
                  <span className="text-sm">HTTPS/Localhost</span>
                </div>
                {getStatusBadge(status.isHTTPS)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.hasManifest)}
                  <span className="text-sm">Web Manifest</span>
                </div>
                {getStatusBadge(status.hasManifest)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.hasServiceWorker)}
                  <span className="text-sm">Service Worker</span>
                </div>
                {getStatusBadge(status.hasServiceWorker)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.isStandalone)}
                  <span className="text-sm">Standalone Mode</span>
                </div>
                {getStatusBadge(status.isStandalone)}
              </div>

              {/* Manifest Details */}
              {status.manifestData && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Manifest Details:</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>Name: {status.manifestData.name}</div>
                    <div>Short Name: {status.manifestData.short_name}</div>
                    <div>Display: {status.manifestData.display}</div>
                    <div>Icons: {status.manifestData.icons?.length || 0}</div>
                  </div>
                </div>
              )}

              {/* Service Worker Details */}
              {status.serviceWorkerStatus && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Service Worker:</h4>
                  <div className="text-xs text-muted-foreground">
                    Status: {status.serviceWorkerStatus}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Installation Instructions */}
          {!status.canInstall && (
            <div className="pt-4 border-t">
              <div className="flex items-start space-x-2 text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">PWA not ready for installation</p>
                  <p className="text-xs mt-1">
                    Make sure all requirements are met. Check the details above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
