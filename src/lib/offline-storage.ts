import type { Habit, HabitEntry, HabitWithStats, ReflectionResponse } from '@/types'

// IndexedDB database name and version
const DB_NAME = 'DopamineDetoxDB'
const DB_VERSION = 1

// Store names
const HABITS_STORE = 'habits'
const HABIT_ENTRIES_STORE = 'habitEntries'
const PENDING_HABITS_STORE = 'pendingHabits'
const PENDING_REFLECTIONS_STORE = 'pendingReflections'
const SYNC_QUEUE_STORE = 'syncQueue'

// Types for offline operations
export interface PendingHabitUpdate {
  id?: number
  action: 'create' | 'update' | 'delete' | 'toggle'
  data: Partial<Habit> | Partial<HabitEntry>
  timestamp: number
  userId: string
  retry_count?: number
}

export interface PendingReflectionUpdate {
  id?: number
  action: 'create'
  data: Partial<ReflectionResponse>
  timestamp: number
  userId: string
  retry_count?: number
}

export interface SyncQueueItem {
  id?: number
  type: 'habit' | 'reflection'
  operation: PendingHabitUpdate | PendingReflectionUpdate
  timestamp: number
}

// IndexedDB Database Setup
export class OfflineStorage {
  private db: IDBDatabase | null = null
  private isInitialized = false

  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('[OfflineStorage] Database opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Habits store
        if (!db.objectStoreNames.contains(HABITS_STORE)) {
          const habitsStore = db.createObjectStore(HABITS_STORE, { keyPath: 'id' })
          habitsStore.createIndex('user_id', 'user_id', { unique: false })
          habitsStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // Habit entries store
        if (!db.objectStoreNames.contains(HABIT_ENTRIES_STORE)) {
          const entriesStore = db.createObjectStore(HABIT_ENTRIES_STORE, { keyPath: 'id' })
          entriesStore.createIndex('habit_id', 'habit_id', { unique: false })
          entriesStore.createIndex('user_id', 'user_id', { unique: false })
          entriesStore.createIndex('completion_date', 'completion_date', { unique: false })
        }

        // Pending operations stores
        if (!db.objectStoreNames.contains(PENDING_HABITS_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_HABITS_STORE, { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false })
          pendingStore.createIndex('userId', 'userId', { unique: false })
        }

        if (!db.objectStoreNames.contains(PENDING_REFLECTIONS_STORE)) {
          const pendingReflectionsStore = db.createObjectStore(PENDING_REFLECTIONS_STORE, { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          pendingReflectionsStore.createIndex('timestamp', 'timestamp', { unique: false })
          pendingReflectionsStore.createIndex('userId', 'userId', { unique: false })
        }

        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('type', 'type', { unique: false })
        }

        console.log('[OfflineStorage] Database schema created/updated')
      }
    })
  }

  // Habit operations
  async saveHabits(habits: HabitWithStats[], userId: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HABITS_STORE], 'readwrite')
      const store = transaction.objectStore(HABITS_STORE)

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()

      // Clear existing habits for this user first
      const userIndex = store.index('user_id')
      const deleteRequest = userIndex.openCursor(IDBKeyRange.only(userId))
      
      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          // Add new habits
          habits.forEach(habit => {
            store.add({...habit, offline_updated_at: new Date().toISOString()})
          })
        }
      }
    })
  }

  async getHabits(userId: string): Promise<HabitWithStats[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HABITS_STORE], 'readonly')
      const store = transaction.objectStore(HABITS_STORE)
      const index = store.index('user_id')
      const request = index.getAll(IDBKeyRange.only(userId))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async saveHabitEntries(entries: HabitEntry[], userId: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HABIT_ENTRIES_STORE], 'readwrite')
      const store = transaction.objectStore(HABIT_ENTRIES_STORE)

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()

      entries.forEach(entry => {
        store.put({...entry, offline_updated_at: new Date().toISOString()})
      })
    })
  }

  async getHabitEntries(userId: string, habitId?: string): Promise<HabitEntry[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HABIT_ENTRIES_STORE], 'readonly')
      const store = transaction.objectStore(HABIT_ENTRIES_STORE)

      let request: IDBRequest
      if (habitId) {
        const index = store.index('habit_id')
        request = index.getAll(IDBKeyRange.only(habitId))
      } else {
        const index = store.index('user_id')
        request = index.getAll(IDBKeyRange.only(userId))
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  // Offline operations queue
  async queueHabitOperation(operation: PendingHabitUpdate): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_HABITS_STORE], 'readwrite')
      const store = transaction.objectStore(PENDING_HABITS_STORE)
      const request = store.add(operation)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('[OfflineStorage] Habit operation queued:', operation.action)
        resolve()
      }
    })
  }

  async queueReflectionOperation(operation: PendingReflectionUpdate): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_REFLECTIONS_STORE], 'readwrite')
      const store = transaction.objectStore(PENDING_REFLECTIONS_STORE)
      const request = store.add(operation)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('[OfflineStorage] Reflection operation queued')
        resolve()
      }
    })
  }

  async getPendingHabitOperations(): Promise<PendingHabitUpdate[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_HABITS_STORE], 'readonly')
      const store = transaction.objectStore(PENDING_HABITS_STORE)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async getPendingReflectionOperations(): Promise<PendingReflectionUpdate[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_REFLECTIONS_STORE], 'readonly')
      const store = transaction.objectStore(PENDING_REFLECTIONS_STORE)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async removePendingOperation(id: number, type: 'habit' | 'reflection'): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    const storeName = type === 'habit' ? PENDING_HABITS_STORE : PENDING_REFLECTIONS_STORE

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log(`[OfflineStorage] Removed pending ${type} operation:`, id)
        resolve()
      }
    })
  }

  // Network status helpers
  isOnline(): boolean {
    return navigator.onLine
  }

  // Register for online/offline events
  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // Utility methods
  async clearCache(userId: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HABITS_STORE, HABIT_ENTRIES_STORE], 'readwrite')
      let completed = 0
      const stores = [HABITS_STORE, HABIT_ENTRIES_STORE]

      transaction.onerror = () => reject(transaction.error)

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const index = store.index('user_id')
        const request = index.openCursor(IDBKeyRange.only(userId))

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            completed++
            if (completed === stores.length) {
              resolve()
            }
          }
        }

        request.onerror = () => reject(request.error)
      })
    })
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()

// Helper functions for habit operations
export async function saveHabitOffline(habit: Habit, userId: string): Promise<void> {
  if (!offlineStorage.isOnline()) {
    await offlineStorage.queueHabitOperation({
      action: 'create',
      data: habit,
      timestamp: Date.now(),
      userId
    })
  }
}

export async function toggleHabitOffline(habitId: string, completed: boolean, userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  if (!offlineStorage.isOnline()) {
    await offlineStorage.queueHabitOperation({
      action: 'toggle',
      data: {
        habit_id: habitId,
        completion_date: today,
        completed,
        user_id: userId
      },
      timestamp: Date.now(),
      userId
    })
  }
}

export async function saveReflectionOffline(reflection: Partial<ReflectionResponse>, userId: string): Promise<void> {
  if (!offlineStorage.isOnline()) {
    await offlineStorage.queueReflectionOperation({
      action: 'create',
      data: reflection,
      timestamp: Date.now(),
      userId
    })
  }
}