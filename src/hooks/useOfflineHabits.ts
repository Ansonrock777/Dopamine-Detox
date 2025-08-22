'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { offlineStorage, toggleHabitOffline, saveHabitOffline } from '@/lib/offline-storage'
import { syncWhenOnline } from '@/components/ServiceWorkerRegistration'
import type { Habit, HabitWithStats, HabitEntry } from '@/types'

export interface UseOfflineHabitsReturn {
  habits: HabitWithStats[]
  loading: boolean
  error: string | null
  isOffline: boolean
  hasPendingSync: boolean
  // Actions
  refreshHabits: () => Promise<void>
  toggleHabit: (habitId: string, completed: boolean) => Promise<void>
  createHabit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'start_date'>) => Promise<void>
  syncPendingOperations: () => Promise<void>
}

export function useOfflineHabits(): UseOfflineHabitsReturn {
  const { user, loading: authLoading } = useAuth()
  const [habits, setHabits] = useState<HabitWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [hasPendingSync, setHasPendingSync] = useState(false)

  // Initialize offline storage and network listeners
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await offlineStorage.init()
        console.log('[useOfflineHabits] Offline storage initialized')
      } catch (error) {
        console.error('[useOfflineHabits] Failed to initialize offline storage:', error)
      }
    }

    initializeStorage()

    // Set up network status listeners
    const cleanup = offlineStorage.onNetworkChange((online) => {
      setIsOffline(!online)
      if (online) {
        console.log('[useOfflineHabits] Back online, syncing...')
        syncPendingOperations()
      }
    })

    return cleanup
  }, [])

  // Check for pending sync operations
  const checkPendingSync = useCallback(async () => {
    if (!user?.id) return

    try {
      const [pendingHabits, pendingReflections] = await Promise.all([
        offlineStorage.getPendingHabitOperations(),
        offlineStorage.getPendingReflectionOperations()
      ])

      const userPendingHabits = pendingHabits.filter(op => op.userId === user.id)
      const userPendingReflections = pendingReflections.filter(op => op.userId === user.id)

      setHasPendingSync(userPendingHabits.length > 0 || userPendingReflections.length > 0)
    } catch (error) {
      console.error('[useOfflineHabits] Error checking pending sync:', error)
    }
  }, [user?.id])

  // Load habits from API or offline storage
  const refreshHabits = useCallback(async () => {
    if (!user?.id || authLoading) return

    setLoading(true)
    setError(null)

    try {
      if (isOffline) {
        // Load from offline storage
        console.log('[useOfflineHabits] Loading habits from offline storage')
        const offlineHabits = await offlineStorage.getHabits(user.id)
        setHabits(offlineHabits)
      } else {
        // Load from API and cache offline
        console.log('[useOfflineHabits] Loading habits from API')
        const response = await fetch('/api/habits', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch habits')
        }

        const data = await response.json()
        const fetchedHabits = data.habits || []

        setHabits(fetchedHabits)

        // Save to offline storage
        await offlineStorage.saveHabits(fetchedHabits, user.id)
        console.log('[useOfflineHabits] Habits cached offline')
      }

      await checkPendingSync()
    } catch (error) {
      console.error('[useOfflineHabits] Error loading habits:', error)
      
      // Try loading from offline storage as fallback
      try {
        const offlineHabits = await offlineStorage.getHabits(user.id)
        if (offlineHabits.length > 0) {
          setHabits(offlineHabits)
          setError('Using offline data - sync when online')
        } else {
          setError(error instanceof Error ? error.message : 'Failed to load habits')
        }
      } catch (offlineError) {
        setError(error instanceof Error ? error.message : 'Failed to load habits')
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, authLoading, isOffline, checkPendingSync])

  // Toggle habit completion
  const toggleHabit = useCallback(async (habitId: string, completed: boolean) => {
    if (!user?.id) return

    try {
      const today = new Date().toISOString().split('T')[0]

      if (isOffline) {
        // Queue for sync when online
        await toggleHabitOffline(habitId, completed, user.id)
        setHasPendingSync(true)
        
        // Update local state optimistically
        setHabits(prevHabits =>
          prevHabits.map(habit =>
            habit.id === habitId
              ? { ...habit, today_completed: completed }
              : habit
          )
        )

        console.log('[useOfflineHabits] Habit toggle queued for sync')
      } else {
        // Make API call
        const response = await fetch(`/api/habits/${habitId}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completion_date: today,
            completed
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to toggle habit')
        }

        // Refresh habits to get updated stats
        await refreshHabits()
      }
    } catch (error) {
      console.error('[useOfflineHabits] Error toggling habit:', error)
      
      // If online request failed, queue it for offline sync
      if (!isOffline) {
        await toggleHabitOffline(habitId, completed, user.id)
        setHasPendingSync(true)
        
        // Update local state optimistically
        setHabits(prevHabits =>
          prevHabits.map(habit =>
            habit.id === habitId
              ? { ...habit, today_completed: completed }
              : habit
          )
        )
      }
    }
  }, [user?.id, isOffline, refreshHabits])

  // Create new habit
  const createHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'start_date'>) => {
    if (!user?.id) return

    try {
      if (isOffline) {
        // Create temporary habit for offline
        const tempHabit: Habit = {
          id: `temp_${Date.now()}`,
          user_id: user.id,
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...habitData
        }

        await saveHabitOffline(tempHabit, user.id)
        setHasPendingSync(true)

        // Add to local state
        setHabits(prevHabits => [
          ...prevHabits,
          {
            ...tempHabit,
            stats: {
              habit_id: tempHabit.id,
              current_streak: 0,
              max_streak: 0,
              consistency_percent: 0,
              total_checkins: 0,
              badge_level: 'none'
            },
            today_completed: false
          }
        ])

        console.log('[useOfflineHabits] Habit created offline, queued for sync')
      } else {
        // Make API call
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(habitData),
        })

        if (!response.ok) {
          throw new Error('Failed to create habit')
        }

        // Refresh habits to get the new habit with proper ID and stats
        await refreshHabits()
      }
    } catch (error) {
      console.error('[useOfflineHabits] Error creating habit:', error)
      
      // If online request failed, save for offline sync
      if (!isOffline) {
        const tempHabit: Habit = {
          id: `temp_${Date.now()}`,
          user_id: user.id,
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...habitData
        }

        await saveHabitOffline(tempHabit, user.id)
        setHasPendingSync(true)
      }

      throw error
    }
  }, [user?.id, isOffline, refreshHabits])

  // Sync pending operations when back online
  const syncPendingOperations = useCallback(async () => {
    if (!user?.id || isOffline) return

    try {
      console.log('[useOfflineHabits] Starting sync of pending operations')
      
      const [pendingHabits, pendingReflections] = await Promise.all([
        offlineStorage.getPendingHabitOperations(),
        offlineStorage.getPendingReflectionOperations()
      ])

      const userPendingHabits = pendingHabits.filter(op => op.userId === user.id)
      const userPendingReflections = pendingReflections.filter(op => op.userId === user.id)

      // Sync habit operations
      for (const operation of userPendingHabits) {
        try {
          let endpoint = '/api/habits'
          let method = 'POST'
          let body = operation.data

          if (operation.action === 'toggle') {
            endpoint = `/api/habits/${operation.data.habit_id}/toggle`
            method = 'POST'
            body = {
              completion_date: operation.data.completion_date,
              completed: operation.data.completed
            }
          }

          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          if (response.ok) {
            await offlineStorage.removePendingOperation(operation.id!, 'habit')
            console.log(`[useOfflineHabits] Synced habit ${operation.action}`)
          } else {
            console.error(`[useOfflineHabits] Failed to sync habit ${operation.action}:`, response.status)
          }
        } catch (error) {
          console.error(`[useOfflineHabits] Error syncing habit operation:`, error)
        }
      }

      // Sync reflection operations
      for (const operation of userPendingReflections) {
        try {
          const response = await fetch('/api/reflection/responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(operation.data),
          })

          if (response.ok) {
            await offlineStorage.removePendingOperation(operation.id!, 'reflection')
            console.log('[useOfflineHabits] Synced reflection response')
          } else {
            console.error('[useOfflineHabits] Failed to sync reflection:', response.status)
          }
        } catch (error) {
          console.error('[useOfflineHabits] Error syncing reflection:', error)
        }
      }

      // Trigger service worker background sync
      syncWhenOnline('habit-sync')
      syncWhenOnline('reflection-sync')

      // Refresh data after sync
      await refreshHabits()
      
      console.log('[useOfflineHabits] Sync completed')
    } catch (error) {
      console.error('[useOfflineHabits] Error during sync:', error)
    }
  }, [user?.id, isOffline, refreshHabits])

  // Load habits on mount and when user changes
  useEffect(() => {
    if (!authLoading) {
      refreshHabits()
    }
  }, [authLoading, refreshHabits])

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && hasPendingSync) {
      syncPendingOperations()
    }
  }, [isOffline, hasPendingSync, syncPendingOperations])

  return {
    habits,
    loading,
    error,
    isOffline,
    hasPendingSync,
    refreshHabits,
    toggleHabit,
    createHabit,
    syncPendingOperations
  }
}