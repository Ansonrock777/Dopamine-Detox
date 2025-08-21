'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { HabitOverview } from '@/types'
import { getBadgeInfo } from '@/lib/badge-utils'

interface HabitStatsProps {
  className?: string
}

export function HabitStats({ className }: HabitStatsProps) {
  const [overview, setOverview] = useState<HabitOverview>({
    total_habits: 0,
    min_current_streak: 0,
    avg_consistency: 0,
    highest_badge: 'none'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/habits/overview')
        if (response.ok) {
          const data = await response.json()
          setOverview(data.overview)
        }
      } catch (error) {
        console.error('Error fetching habit overview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="text-center bg-gray-900 border-gray-700">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="h-8 bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-600 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {/* Minimum Current Streak */}
      <Card className="text-center bg-gray-900 border-gray-700">
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <div className="text-3xl sm:text-4xl font-bold mb-2 text-white flex items-center justify-center gap-2">
            {overview.min_current_streak > 0 && <span className="text-xl sm:text-2xl">🔥</span>}
            {overview.min_current_streak}
          </div>
          <div className="text-sm text-gray-400">
            Streak
          </div>
        </CardContent>
      </Card>

      {/* Average Consistency */}
      <Card className="text-center bg-gray-900 border-gray-700">
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <div className="text-3xl sm:text-4xl font-bold mb-2 text-white">
            {Math.round(overview.avg_consistency)}%
          </div>
          <div className="text-sm text-gray-400">
            Consistency
          </div>
        </CardContent>
      </Card>

      {/* Highest Badge */}
      <Card className="text-center bg-gray-900 border-gray-700">
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <div className="text-3xl sm:text-4xl font-bold mb-2 text-white flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl">{getBadgeInfo(overview.highest_badge).icon}</span>
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg leading-tight">{getBadgeInfo(overview.highest_badge).name}</span>
              <span className="text-xs text-gray-400 leading-tight">{getBadgeInfo(overview.highest_badge).rarity}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Trophy
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface IndividualHabitStatsProps {
  streak: number
  consistency: number
  checkins: number
  className?: string
}

export function IndividualHabitStats({ 
  streak, 
  consistency, 
  checkins, 
  className 
}: IndividualHabitStatsProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 text-center ${className}`}>
      <div>
        <div className="text-2xl font-bold">{streak}</div>
        <div className="text-xs text-muted-foreground">Streak</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{Math.round(consistency)}%</div>
        <div className="text-xs text-muted-foreground">Consistency</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{checkins}</div>
        <div className="text-xs text-muted-foreground">Check-ins</div>
      </div>
    </div>
  )
}

export default HabitStats