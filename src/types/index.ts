export interface User {
  id: string
  email: string
  created_at: string
}

export interface BlockedWebsite {
  id: string
  user_id: string
  url: string
  is_always_on: boolean
  created_at: string
}



export interface Timer {
  id: string
  user_id: string
  type: "blocking"
  start_time: string // Format: "HH:mm" (e.g., "20:00")
  end_time: string   // Format: "HH:mm" (e.g., "01:00")
  duration?: number // Keep for backward compatibility
  is_active: boolean
  created_at: string
}

export interface FocusPreset {
  id: string
  user_id: string
  name: string
  start_time: string // Format: "HH:mm" (e.g., "08:30")
  end_time: string   // Format: "HH:mm" (e.g., "13:00")
  blocking_duration?: number // Keep for backward compatibility
  blocked_websites: string[]
  created_at: string
}

// NextDNS Export Format (replaces Chrome Extension)
export interface NextDNSConfig {
  version: string
  exported_at: string
  blocklist: string[]
  categories: string[]
  timers: {
    type: "blocking"
    duration_minutes: number
  }[]
  presets: {
    name: string
    start_time: string
    end_time: string
    blocking_duration?: number
    blocked_websites: string[]
  }[]
}

// NextDNS Integration Types
export interface NextDNSAccount {
  id: string
  user_id: string
  api_key: string
  profile_id: string
  profile_name: string
  is_active: boolean
  last_sync: string
  created_at: string
  updated_at: string
}

// Website rule used by the UI for time-based blocking configuration
export interface WebsiteRule {
  id: string
  user_id: string
  url: string
  start_time: string // HH:MM
  end_time: string   // HH:MM
  action: 'block'
  is_active: boolean
  created_at: string
}

export interface NextDNSCategory {
  id: string
  user_id: string
  category_id: string
  category_name: string
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface NextDNSSyncLog {
  id: string
  user_id: string
  operation: string
  resource_type: string
  resource_id: string
  status: 'pending' | 'success' | 'failed'
  error_message?: string
  created_at: string
}

// Reflection Wall Types
export interface ReflectionQuestion {
  id: string
  question: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReflectionResponse {
  id: string
  user_id: string
  question_id: string
  response: string
  website_url: string
  blocked_at: string
  reflected_at: string
  was_unblocked: boolean
  created_at: string
  reflection_questions?: ReflectionQuestion
}

export interface ReflectionSettings {
  id: string
  user_id: string
  is_enabled: boolean
  require_response: boolean
  cooldown_minutes: number
  questions_per_session: number
  created_at: string
  updated_at: string
}

// Auth types
export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    email?: string
    full_name?: string
  }
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  user: AuthUser
}

// Habit Tracking Types
export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  emoji: string
  is_active: boolean
  start_date: string // Format: "YYYY-MM-DD"
  created_at: string
  updated_at: string
}

export interface HabitEntry {
  id: string
  habit_id: string
  user_id: string
  completion_date: string // Format: "YYYY-MM-DD"
  completed: boolean
  created_at: string
  updated_at: string
}

export interface HabitStats {
  habit_id: string
  current_streak: number
  max_streak: number
  consistency_percent: number
  total_checkins: number
  badge_level: 'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable'
}

export interface HabitOverview {
  total_habits: number
  min_current_streak: number
  avg_consistency: number
  highest_badge: 'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable'
}

export interface HabitWithStats extends Habit {
  stats: HabitStats
  today_completed: boolean
}

export interface HabitCalendarEntry {
  date: string
  completed: boolean
}