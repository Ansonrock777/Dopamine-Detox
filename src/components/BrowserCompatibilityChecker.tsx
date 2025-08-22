'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface CompatibilityCheck {
  feature: string
  supported: boolean
  critical: boolean
  description: string
}

interface BrowserInfo {
  name: string
  version: string
  mobile: boolean
  compatibility: 'excellent' | 'good' | 'partial' | 'poor'
}

export function BrowserCompatibilityChecker() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [compatibilityChecks, setCompatibilityChecks] = useState<CompatibilityCheck[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    detectBrowser()
    runCompatibilityChecks()
  }, [])

  const detectBrowser = () => {
    const ua = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'
    let mobile = false
    let compatibility: BrowserInfo['compatibility'] = 'poor'

    // Detect mobile
    mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)

    // Detect browser
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1) {
      name = 'Chrome'
      const match = ua.match(/Chrome\/(\d+)\./)
      version = match ? match[1] : 'Unknown'
      compatibility = parseInt(version) >= 88 ? 'excellent' : parseInt(version) >= 80 ? 'good' : 'partial'
    } else if (ua.indexOf('Firefox') > -1) {
      name = 'Firefox'
      const match = ua.match(/Firefox\/(\d+)\./)
      version = match ? match[1] : 'Unknown'
      compatibility = parseInt(version) >= 85 ? 'excellent' : parseInt(version) >= 75 ? 'good' : 'partial'
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      name = 'Safari'
      const match = ua.match(/Version\/(\d+)\./)
      version = match ? match[1] : 'Unknown'
      compatibility = parseInt(version) >= 14 ? 'good' : parseInt(version) >= 12 ? 'partial' : 'poor'
    } else if (ua.indexOf('Edge') > -1) {
      name = 'Edge'
      const match = ua.match(/Edge\/(\d+)\./)
      version = match ? match[1] : 'Unknown'
      compatibility = parseInt(version) >= 88 ? 'excellent' : 'partial'
    }

    setBrowserInfo({ name, version, mobile, compatibility })
  }

  const runCompatibilityChecks = () => {
    const checks: CompatibilityCheck[] = [
      {
        feature: 'Service Worker',
        supported: 'serviceWorker' in navigator,
        critical: true,
        description: 'Required for offline functionality and background sync'
      },
      {
        feature: 'Push Notifications',
        supported: 'Notification' in window && 'PushManager' in window,
        critical: false,
        description: 'Enables habit reminders and reflection prompts'
      },
      {
        feature: 'Web App Manifest',
        supported: 'onbeforeinstallprompt' in window || 'standalone' in navigator,
        critical: true,
        description: 'Allows app installation on home screen'
      },
      {
        feature: 'IndexedDB',
        supported: 'indexedDB' in window,
        critical: true,
        description: 'Required for offline data storage'
      },
      {
        feature: 'Background Sync',
        supported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration?.prototype,
        critical: false,
        description: 'Syncs data when connection is restored'
      },
      {
        feature: 'Web Share API',
        supported: 'share' in navigator,
        critical: false,
        description: 'Enables native sharing capabilities'
      },
      {
        feature: 'Cache API',
        supported: 'caches' in window,
        critical: true,
        description: 'Required for offline caching of resources'
      },
      {
        feature: 'Intersection Observer',
        supported: 'IntersectionObserver' in window,
        critical: false,
        description: 'Improves performance for lazy loading'
      },
      {
        feature: 'CSS Grid',
        supported: CSS.supports('display', 'grid'),
        critical: false,
        description: 'Modern layout system for better responsive design'
      },
      {
        feature: 'Local Storage',
        supported: typeof Storage !== 'undefined',
        critical: true,
        description: 'Required for storing user preferences'
      }
    ]

    setCompatibilityChecks(checks)
  }

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'partial': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getCompatibilityText = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return 'Excellent PWA Support'
      case 'good': return 'Good PWA Support'
      case 'partial': return 'Partial PWA Support'
      case 'poor': return 'Limited PWA Support'
      default: return 'Unknown Compatibility'
    }
  }

  const criticalIssues = compatibilityChecks.filter(check => check.critical && !check.supported)
  const supportedFeatures = compatibilityChecks.filter(check => check.supported).length
  const totalFeatures = compatibilityChecks.length

  if (!browserInfo) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Browser Compatibility
        </CardTitle>
        <CardDescription>
          PWA features supported in your browser
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Browser Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <div className="font-medium">
              {browserInfo.name} {browserInfo.version}
              {browserInfo.mobile && ' (Mobile)'}
            </div>
            <div className="text-sm text-muted-foreground">
              {supportedFeatures}/{totalFeatures} features supported
            </div>
          </div>
          <Badge className={getCompatibilityColor(browserInfo.compatibility)}>
            {getCompatibilityText(browserInfo.compatibility)}
          </Badge>
        </div>

        {/* Critical Issues Warning */}
        {criticalIssues.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Critical Issues Detected</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Your browser doesn&apos;t support some core PWA features. The app may not work as expected.
            </p>
            <div className="mt-2 space-y-1">
              {criticalIssues.map((issue, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-300">
                  • {issue.feature}: {issue.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Support Overview */}
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <span className="font-medium">Feature Details</span>
            <span className="text-sm text-muted-foreground">
              {showDetails ? 'Hide' : 'Show'} ({supportedFeatures}/{totalFeatures})
            </span>
          </button>

          {showDetails && (
            <div className="space-y-2">
              {compatibilityChecks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 border rounded-lg"
                >
                  {check.supported ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : check.critical ? (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{check.feature}</span>
                      {check.critical && (
                        <Badge variant="outline" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {check.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {browserInfo.compatibility !== 'excellent' && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4" />
              <span className="font-medium">Recommendations</span>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300 mt-1 space-y-1">
              {browserInfo.name === 'Safari' && (
                <p>• For best experience, consider using Chrome or Firefox</p>
              )}
              {parseInt(browserInfo.version) < 80 && browserInfo.name === 'Chrome' && (
                <p>• Update to Chrome 88+ for full PWA support</p>
              )}
              {parseInt(browserInfo.version) < 85 && browserInfo.name === 'Firefox' && (
                <p>• Update to Firefox 85+ for improved PWA features</p>
              )}
              <p>• Enable JavaScript for full functionality</p>
              <p>• Allow notifications for habit reminders</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}