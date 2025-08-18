import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserHabitOverview } from '@/lib/database'
import { env } from '@/lib/env'
import { testSupabaseConnection } from '@/lib/supabase'

// GET /api/habits/overview - Get user's overall habit statistics
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase env not configured; returning default overview')
      return NextResponse.json({
        overview: {
          total_habits: 0,
          min_current_streak: 0,
          avg_consistency: 0,
          highest_badge: 'none' as const,
        },
      })
    }

    const connectionOk = await testSupabaseConnection().catch(() => false)
    if (!connectionOk) {
      console.warn('Supabase connection unavailable; returning default overview')
      return NextResponse.json({
        overview: {
          total_habits: 0,
          min_current_streak: 0,
          avg_consistency: 0,
          highest_badge: 'none' as const,
        },
      })
    }

    const overview = await getUserHabitOverview(userId)
    
    return NextResponse.json({ overview })
  } catch (error) {
    console.error('Error getting habit overview:', error)
    return NextResponse.json(
      { error: 'Failed to get habit overview' },
      { status: 500 }
    )
  }
}