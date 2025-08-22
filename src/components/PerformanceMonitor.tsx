'use client'

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number    // Largest Contentful Paint
  fid?: number    // First Input Delay  
  cls?: number    // Cumulative Layout Shift
  fcp?: number    // First Contentful Paint
  ttfb?: number   // Time to First Byte
  
  // PWA specific
  serviceWorkerStatus?: string
  cacheHitRate?: number
  offlineReadyTime?: number
  installPromptShown?: boolean
  appInstalled?: boolean
  
  // User engagement
  sessionDuration?: number
  pageViews?: number
  interactionCount?: number
}

export function PerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({})
  const sessionStartTime = useRef<number>(Date.now())
  const interactionCount = useRef<number>(0)

  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()
    
    // Track user interactions
    const trackInteraction = () => {
      interactionCount.current += 1
    }

    // Add interaction listeners
    document.addEventListener('click', trackInteraction)
    document.addEventListener('keydown', trackInteraction)
    document.addEventListener('scroll', trackInteraction)

    // Cleanup
    return () => {
      document.removeEventListener('click', trackInteraction)
      document.removeEventListener('keydown', trackInteraction)  
      document.removeEventListener('scroll', trackInteraction)
    }
  }, [])

  const initializePerformanceMonitoring = () => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        metricsRef.current.lcp = lastEntry.startTime
        console.log('[Performance] LCP:', lastEntry.startTime)
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (_e) {
        console.warn('[Performance] LCP observer not supported')
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
          metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime
          console.log('[Performance] FID:', fidEntry.processingStart - fidEntry.startTime)
        })
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (_e) {
        console.warn('[Performance] FID observer not supported')
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number }
          if (!clsEntry.hadRecentInput) {
            metricsRef.current.cls = (metricsRef.current.cls || 0) + clsEntry.value
          }
        })
        console.log('[Performance] CLS:', metricsRef.current.cls)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (_e) {
        console.warn('[Performance] CLS observer not supported')
      }

      // Navigation timing
      if ('performance' in window && 'getEntriesByType' in performance) {
        setTimeout(() => {
          const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
          if (navigationEntries.length > 0) {
            const navigation = navigationEntries[0]
            
            // First Contentful Paint
            const paintEntries = performance.getEntriesByType('paint')
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
            if (fcpEntry) {
              metricsRef.current.fcp = fcpEntry.startTime
              console.log('[Performance] FCP:', fcpEntry.startTime)
            }

            // Time to First Byte
            metricsRef.current.ttfb = navigation.responseStart - navigation.requestStart
            console.log('[Performance] TTFB:', metricsRef.current.ttfb)
          }
        }, 1000)
      }
    }

    // Monitor Service Worker status
    monitorServiceWorker()
    
    // Monitor PWA installation
    monitorPWAInstallation()

    // Send metrics periodically
    setInterval(() => {
      sendMetrics()
    }, 30000) // Every 30 seconds

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      sendMetrics(true)
    })
  }

  const monitorServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        metricsRef.current.serviceWorkerStatus = 'ready'
        console.log('[Performance] Service Worker ready')
        
        // Monitor cache performance
        monitorCachePerformance()
      }).catch(() => {
        metricsRef.current.serviceWorkerStatus = 'failed'
      })
    } else {
      metricsRef.current.serviceWorkerStatus = 'not-supported'
    }
  }

  const monitorCachePerformance = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const totalRequests = 0
        const cacheHits = 0

        // This would need to be implemented with actual cache metrics
        // For now, we'll simulate based on service worker logs
        const startTime = performance.now()
        
        // Simulate cache hit measurement
        setTimeout(() => {
          const endTime = performance.now()
          metricsRef.current.offlineReadyTime = endTime - startTime
          console.log('[Performance] Offline ready time:', metricsRef.current.offlineReadyTime)
        }, 100)
        
      } catch (error) {
        console.warn('[Performance] Cache monitoring failed:', error)
      }
    }
  }

  const monitorPWAInstallation = () => {
    // Track install prompt
    window.addEventListener('beforeinstallprompt', () => {
      metricsRef.current.installPromptShown = true
      console.log('[Performance] Install prompt shown')
    })

    // Track app installation
    window.addEventListener('appinstalled', () => {
      metricsRef.current.appInstalled = true
      console.log('[Performance] App installed')
    })

    // Check if already running as PWA
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      metricsRef.current.appInstalled = true
    }
  }

  const sendMetrics = (isBeforeUnload = false) => {
    const currentTime = Date.now()
    const sessionDuration = currentTime - sessionStartTime.current

    const metrics: PerformanceMetrics = {
      ...metricsRef.current,
      sessionDuration,
      interactionCount: interactionCount.current,
      pageViews: 1 // Could be tracked more comprehensively
    }

    // In a real app, you'd send this to your analytics service
    console.log('[Performance] Metrics:', metrics)

    // For demo purposes, store in localStorage
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('pwa-performance-metrics') || '[]')
      existingMetrics.push({
        ...metrics,
        timestamp: currentTime,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
      
      // Keep only last 100 entries
      const recentMetrics = existingMetrics.slice(-100)
      localStorage.setItem('pwa-performance-metrics', JSON.stringify(recentMetrics))
    } catch (error) {
      console.warn('[Performance] Failed to store metrics:', error)
    }

    // Send to analytics service (example)
    if (!isBeforeUnload && navigator.onLine) {
      sendToAnalytics(metrics)
    }
  }

  const sendToAnalytics = async (metrics: PerformanceMetrics) => {
    // Example of sending to analytics service
    // In a real app, you'd send to your preferred analytics provider
    
    try {
      // Example: Google Analytics 4 event
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'pwa_performance', {
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          service_worker_status: metrics.serviceWorkerStatus,
          session_duration: metrics.sessionDuration,
          interaction_count: metrics.interactionCount
        })
      }

      // Example: Custom analytics endpoint
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metrics)
      // })
      
    } catch (error) {
      console.warn('[Performance] Failed to send analytics:', error)
    }
  }

  // This component doesn't render anything visible
  return null
}

// Utility function to get performance metrics from localStorage
export const getStoredMetrics = (): PerformanceMetrics[] => {
  try {
    return JSON.parse(localStorage.getItem('pwa-performance-metrics') || '[]')
  } catch (error) {
    console.warn('[Performance] Failed to read stored metrics:', error)
    return []
  }
}

// Utility function to clear stored metrics
export const clearStoredMetrics = (): void => {
  try {
    localStorage.removeItem('pwa-performance-metrics')
    console.log('[Performance] Cleared stored metrics')
  } catch (error) {
    console.warn('[Performance] Failed to clear metrics:', error)
  }
}