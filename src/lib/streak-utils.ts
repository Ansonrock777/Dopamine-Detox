import { HabitEntry, HabitCalendarEntry } from '@/types'
import { getTodayLocalDate } from './timezone'

/**
 * Calculate current streak based on consecutive completed days
 * If today is completed, streak includes today and counts backwards
 * If today is not completed, streak counts backwards from yesterday
 * Example: 4 days consistent, on 5th day:
 * - If 5th day not completed yet: shows 4
 * - If 5th day completed: shows 5
 */
export function calculateCurrentStreak(entries: HabitEntry[] | HabitCalendarEntry[]): number {
  if (!entries || entries.length === 0) return 0

  const today = getTodayLocalDate()

  // Build a set of unique completed dates (YYYY-MM-DD) up to and including today
  const completedDates = new Set(
    entries
      .filter(e => e.completed)
      .map(e => ('completion_date' in e ? e.completion_date : e.date))
      .filter(date => date <= today)
  )

  let streak = 0
  let currentDate = new Date(today)

  // If today is completed, start from today; otherwise start from yesterday
  if (!completedDates.has(today)) {
    currentDate.setDate(currentDate.getDate() - 1)
  }

  // Count consecutive completions backwards
  for (let i = 0; i < 366; i++) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (completedDates.has(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculate maximum streak achieved across all time
 */
export function calculateMaxStreak(entries: HabitEntry[] | HabitCalendarEntry[]): number {
  if (!entries || entries.length === 0) return 0

  // Convert entries to a consistent format and sort by date ascending
  const completions = entries
    .map(entry => ({
      date: 'completion_date' in entry ? entry.completion_date : entry.date,
      completed: entry.completed
    }))
    .filter(entry => entry.completed) // Only consider completed entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Oldest first

  if (completions.length === 0) return 0

  let maxStreak = 0
  let currentStreak = 0
  let expectedDate: Date | null = null

  for (const completion of completions) {
    const completionDate = new Date(completion.date)
    
    if (expectedDate === null) {
      // First completion
      currentStreak = 1
      expectedDate = new Date(completionDate)
      expectedDate.setDate(expectedDate.getDate() + 1)
    } else {
      // Check if this completion is consecutive
      if (completionDate.getTime() === expectedDate.getTime()) {
        currentStreak++
        expectedDate.setDate(expectedDate.getDate() + 1)
      } else {
        // Streak broken, start new streak
        maxStreak = Math.max(maxStreak, currentStreak)
        currentStreak = 1
        expectedDate = new Date(completionDate)
        expectedDate.setDate(expectedDate.getDate() + 1)
      }
    }
  }

  return Math.max(maxStreak, currentStreak)
}

/**
 * Calculate consistency percentage over a given period
 * Consistency Logic: consistency = (completed_days ÷ active_days) × 100
 * Where:
 * - active_days = (today - habit.start_date) + 1 (inclusive)
 * - completed_days = number of unique days completed between habit.start_date and today
 * Only count days ≤ today (ignore future)
 * Round to nearest whole %, clamp between 0–100
 * Use the user's local timezone → store completions as pure dates (no time)
 */
export function calculateConsistency(
  entries: HabitEntry[] | HabitCalendarEntry[],
  startDate: string,
  endDate?: string
): number {
  if (!entries || entries.length === 0) return 0

  const end = endDate || getTodayLocalDate()
  const start = new Date(startDate)
  const endDateObj = new Date(end)

  // active_days = (today - start_date) + 1, inclusive
  const totalDays = Math.floor((endDateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (totalDays <= 0) return 0

  // completed_days = number of UNIQUE days completed between start_date and today (inclusive)
  const completedDateSet = new Set<string>()
  for (const entry of entries) {
    if (!entry.completed) continue
    const entryDateStr = 'completion_date' in entry ? entry.completion_date : entry.date
    const entryDate = new Date(entryDateStr)
    if (entryDate >= start && entryDate <= endDateObj) {
      completedDateSet.add(entryDateStr)
    }
  }

  const completedDays = completedDateSet.size
  const rawPercent = (completedDays / totalDays) * 100

  // Clamp to [0, 100]
  const clamped = Math.min(100, Math.max(0, rawPercent))
  return clamped
}

/**
 * Get badge level based on max streak
 */
export function getBadgeLevel(maxStreak: number): 'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable' {
  if (maxStreak >= 100) return 'unstoppable'
  if (maxStreak >= 50) return 'on_fire'
  if (maxStreak >= 21) return 'steady'
  if (maxStreak >= 7) return 'spark'
  if (maxStreak >= 1) return 'getting_started'
  return 'none'
}

/**
 * Calculate all habit stats for a habit
 */
export function calculateHabitStats(
  habitId: string,
  entries: HabitEntry[] | HabitCalendarEntry[],
  habitStartDate: string
): {
  habit_id: string
  current_streak: number
  max_streak: number
  consistency_percent: number
  badge_level: 'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable'
} {
  const currentStreak = calculateCurrentStreak(entries)
  const maxStreak = calculateMaxStreak(entries)
  const consistency = calculateConsistency(entries, habitStartDate)
  const badgeLevel = getBadgeLevel(maxStreak)

  return {
    habit_id: habitId,
    current_streak: currentStreak,
    max_streak: maxStreak,
    consistency_percent: consistency,
    badge_level: badgeLevel
  }
}