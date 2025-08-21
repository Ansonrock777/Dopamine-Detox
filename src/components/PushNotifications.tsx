'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Clock, Target, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NotificationSettings {
  enabled: boolean
  habitReminders: boolean
  reflectionPrompts: boolean
  reminderTime: string // HH:mm format
  reflectionFrequency: number // hours
}

export function PushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    habitReminders: true,
    reflectionPrompts: true,
    reminderTime: '09:00',
    reflectionFrequency: 4 // every 4 hours
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkNotificationStatus()
    loadSettings()
  }, [user?.id])

  const checkNotificationStatus = async () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready
          const sub = await registration.pushManager.getSubscription()
          setSubscription(sub)
        } catch (error) {
          console.error('[PushNotifications] Error checking subscription:', error)
        }
      }
    }
  }

  const loadSettings = async () => {
    if (!user?.id) return

    try {
      // Load from localStorage for now (could be moved to API)
      const saved = localStorage.getItem(`notification-settings-${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('[PushNotifications] Error loading settings:', error)
    }
  }

  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!user?.id) return

    try {
      localStorage.setItem(`notification-settings-${user.id}`, JSON.stringify(newSettings))
      setSettings(newSettings)

      // Schedule notifications based on new settings
      if (newSettings.enabled) {
        await scheduleNotifications(newSettings)
      } else {
        await clearScheduledNotifications()
      }
    } catch (error) {
      console.error('[PushNotifications] Error saving settings:', error)
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    setIsLoading(true)
    
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
        await saveSettings({ ...settings, enabled: true })
      }
    } catch (error) {
      console.error('[PushNotifications] Error requesting permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[PushNotifications] Push messaging is not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!vapidPublicKey) {
          console.warn('[PushNotifications] VAPID public key not configured')
          // For demo purposes, we'll use local notifications
          subscription = await createLocalSubscription(registration)
        } else {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })
        }
      }

      setSubscription(subscription)
      console.log('[PushNotifications] Push subscription created:', subscription)

      // Send subscription to server (would be implemented in real app)
      // await sendSubscriptionToServer(subscription)
      
    } catch (error) {
      console.error('[PushNotifications] Error subscribing to push:', error)
    }
  }

  // Fallback to local notifications for demo
  const createLocalSubscription = async (registration: ServiceWorkerRegistration) => {
    // This is a mock subscription for local notifications
    return {
      endpoint: 'local-notification',
      keys: {},
      options: { userVisibleOnly: true }
    } as any
  }

  const scheduleNotifications = async (notificationSettings: NotificationSettings) => {
    if (!notificationSettings.enabled) return

    console.log('[PushNotifications] Scheduling notifications:', notificationSettings)

    // For demo purposes, we'll use local scheduling
    // In a real app, this would be handled by a backend service

    if (notificationSettings.habitReminders) {
      await scheduleHabitReminders(notificationSettings.reminderTime)
    }

    if (notificationSettings.reflectionPrompts) {
      await scheduleReflectionPrompts(notificationSettings.reflectionFrequency)
    }
  }

  const scheduleHabitReminders = async (reminderTime: string) => {
    // Schedule daily habit reminders
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const reminderDate = new Date()
    reminderDate.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1)
    }

    const delay = reminderDate.getTime() - now.getTime()

    setTimeout(() => {
      showLocalNotification({
        title: '🎯 Time for your habits!',
        body: 'Check in with your daily habits and keep your streaks going.',
        type: 'habit_reminder',
        habitId: 'daily'
      })

      // Schedule for next day
      setInterval(() => {
        showLocalNotification({
          title: '🎯 Daily Habit Check-in',
          body: 'How are you doing with your habits today?',
          type: 'habit_reminder',
          habitId: 'daily'
        })
      }, 24 * 60 * 60 * 1000) // 24 hours
    }, delay)
  }

  const scheduleReflectionPrompts = async (frequencyHours: number) => {
    // Schedule reflection prompts
    const intervalMs = frequencyHours * 60 * 60 * 1000

    const reflectionMessages = [
      'How are you feeling about your screen time today?',
      'What triggered your last urge to check social media?',
      'Take a moment to reflect on your digital wellness journey.',
      'How has reducing screen time affected your mood today?',
      'What non-digital activity could you do right now instead?'
    ]

    setInterval(() => {
      const randomMessage = reflectionMessages[Math.floor(Math.random() * reflectionMessages.length)]
      
      showLocalNotification({
        title: '🤔 Reflection Time',
        body: randomMessage,
        type: 'reflection_prompt'
      })
    }, intervalMs)
  }

  const showLocalNotification = (data: any) => {
    if (Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.type,
        data: data
      })
    }
  }

  const clearScheduledNotifications = async () => {
    // Clear any scheduled notifications
    console.log('[PushNotifications] Clearing scheduled notifications')
    // In a real implementation, you'd clear server-side scheduled notifications
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!('Notification' in window)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support push notifications. Consider using a modern browser like Chrome or Firefox.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
          {permission === 'granted' && (
            <Badge variant="default" className="bg-green-500">
              Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Get reminded to check your habits and reflect on your digital wellness journey.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {permission === 'default' && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Enable Notifications
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Get helpful reminders to stay on track with your digital wellness goals.
                </p>
              </div>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Notifications Blocked
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  You've blocked notifications. Enable them in your browser settings to receive reminders.
                </p>
              </div>
            </div>
          </div>
        )}

        {permission !== 'granted' ? (
          <Button 
            onClick={requestPermission}
            disabled={isLoading || permission === 'denied'}
            className="w-full"
          >
            <Bell className="w-4 h-4 mr-2" />
            {isLoading ? 'Requesting Permission...' : 'Enable Notifications'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Enable Notifications
              </Label>
              <Switch
                id="notifications-enabled"
                checked={settings.enabled}
                onCheckedChange={(enabled) => saveSettings({ ...settings, enabled })}
              />
            </div>

            {settings.enabled && (
              <>
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="habit-reminders" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Habit Reminders
                    </Label>
                    <Switch
                      id="habit-reminders"
                      checked={settings.habitReminders}
                      onCheckedChange={(habitReminders) => 
                        saveSettings({ ...settings, habitReminders })
                      }
                    />
                  </div>

                  {settings.habitReminders && (
                    <div className="ml-6">
                      <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">
                        Reminder Time
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <input
                          id="reminder-time"
                          type="time"
                          value={settings.reminderTime}
                          onChange={(e) => 
                            saveSettings({ ...settings, reminderTime: e.target.value })
                          }
                          className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reflection-prompts" className="flex items-center gap-2">
                      🤔 Reflection Prompts
                    </Label>
                    <Switch
                      id="reflection-prompts"
                      checked={settings.reflectionPrompts}
                      onCheckedChange={(reflectionPrompts) => 
                        saveSettings({ ...settings, reflectionPrompts })
                      }
                    />
                  </div>

                  {settings.reflectionPrompts && (
                    <div className="ml-6">
                      <Label htmlFor="reflection-frequency" className="text-sm text-muted-foreground">
                        Frequency (hours)
                      </Label>
                      <select
                        id="reflection-frequency"
                        value={settings.reflectionFrequency}
                        onChange={(e) => 
                          saveSettings({ ...settings, reflectionFrequency: Number(e.target.value) })
                        }
                        className="mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>Every hour</option>
                        <option value={2}>Every 2 hours</option>
                        <option value={4}>Every 4 hours</option>
                        <option value={6}>Every 6 hours</option>
                        <option value={8}>Every 8 hours</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}