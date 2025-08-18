import type { HabitStats } from '@/types'

export type BadgeLevel = 'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable'

export interface BadgeInfo {
  icon: string
  name: string
  description: string
  daysRequired: number
  rarity: string
}

export const BADGE_CONFIG: Record<BadgeLevel, BadgeInfo> = {
  none: {
    icon: '⚫',
    name: 'None',
    description: 'No streak yet',
    daysRequired: 0,
    rarity: 'None'
  },
  getting_started: {
    icon: '🌱',
    name: 'Getting Started',
    description: '1+ days streak',
    daysRequired: 1,
    rarity: 'Bronze'
  },
  spark: {
    icon: '⚡',
    name: 'Spark',
    description: '3+ days streak',
    daysRequired: 3,
    rarity: 'Bronze'
  },
  steady: {
    icon: '🔥',
    name: 'Steady',
    description: '7+ days streak',
    daysRequired: 7,
    rarity: 'Silver'
  },
  on_fire: {
    icon: '🚀',
    name: 'On Fire',
    description: '14+ days streak',
    daysRequired: 14,
    rarity: 'Gold'
  },
  unstoppable: {
    icon: '👑',
    name: 'Unstoppable',
    description: '30+ days streak',
    daysRequired: 30,
    rarity: 'Diamond'
  }
}

export function getBadgeInfo(badgeLevel: BadgeLevel | undefined | null): BadgeInfo {
  if (!badgeLevel || !(badgeLevel in BADGE_CONFIG)) {
    return BADGE_CONFIG.none
  }
  return BADGE_CONFIG[badgeLevel]
}

export function getBadgeForStreak(streak: number): BadgeLevel {
  if (streak >= 30) return 'unstoppable'
  if (streak >= 14) return 'on_fire'
  if (streak >= 7) return 'steady'
  if (streak >= 3) return 'spark'
  if (streak >= 1) return 'getting_started'
  return 'none'
}

export function getNextBadgeInfo(currentBadge: BadgeLevel): BadgeInfo | null {
  const badges: BadgeLevel[] = ['none', 'getting_started', 'spark', 'steady', 'on_fire', 'unstoppable']
  const currentIndex = badges.indexOf(currentBadge)
  
  if (currentIndex < badges.length - 1) {
    return BADGE_CONFIG[badges[currentIndex + 1]]
  }
  
  return null // Already at highest badge
}

export function getBadgeProgress(currentStreak: number, maxStreak: number): {
  current: BadgeInfo
  next: BadgeInfo | null
  progress: number
  streakToNext: number
} {
  const currentBadge = getBadgeForStreak(maxStreak)
  const currentBadgeInfo = getBadgeInfo(currentBadge)
  const nextBadgeInfo = getNextBadgeInfo(currentBadge)
  
  let progress = 100
  let streakToNext = 0
  
  if (nextBadgeInfo) {
    const currentBadgeDays = currentBadgeInfo.daysRequired
    const nextBadgeDays = nextBadgeInfo.daysRequired
    const totalDaysNeeded = nextBadgeDays - currentBadgeDays
    const daysCompleted = Math.max(0, maxStreak - currentBadgeDays)
    
    progress = totalDaysNeeded > 0 ? Math.min(100, (daysCompleted / totalDaysNeeded) * 100) : 100
    streakToNext = Math.max(0, nextBadgeDays - maxStreak)
  }
  
  return {
    current: currentBadgeInfo,
    next: nextBadgeInfo,
    progress,
    streakToNext
  }
}