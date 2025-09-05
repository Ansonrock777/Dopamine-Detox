import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getHabitsWithStats, 
  createHabit
} from '@/lib/database'
import { env } from '@/lib/env'
import { testSupabaseConnection } from '@/lib/supabase'

// GET /api/habits - Get user's habits with stats
export async function GET() {
  try {
    const { userId } = await auth()
    console.log('API: [GET HABITS] User ID from auth:', userId)
    console.log('API: [GET HABITS] Full auth context:', { userId })

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Supabase env vars
    console.log('API: Checking Supabase env vars...')
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('API: Supabase env not configured')
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
    }

    // Test Supabase connection
    console.log('API: Testing Supabase connection...')
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      console.error('API: Supabase connection failed')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    console.log('API: Getting habits with stats...')
    const habits = await getHabitsWithStats(userId)
    console.log('API: Retrieved habits:', habits?.length || 0)

    return NextResponse.json(habits)
  } catch (error) {
    console.error('API: Error getting habits:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get habits' },
      { status: 500 }
    )
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    console.log('API: [CREATE HABIT] User ID from auth:', userId)
    console.log('API: [CREATE HABIT] Full auth context:', { userId })
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, emoji } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      )
    }

    // Validate habit name length
    if (name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: 'Habit name must be between 1 and 100 characters' },
        { status: 400 }
      )
    }

    // Validate description length if provided
    if (description && typeof description === 'string' && description.length > 255) {
      return NextResponse.json(
        { error: 'Description must be less than 255 characters' },
        { status: 400 }
      )
    }

    // Validate emoji if provided
    if (emoji && (typeof emoji !== 'string' || emoji.length > 10)) {
      return NextResponse.json(
        { error: 'Invalid emoji format' },
        { status: 400 }
      )
    }


    // Create the habit
    console.log('API: [CREATE HABIT] Creating habit with data:', {
      name: name.trim(),
      description: description?.trim() || undefined,
      emoji: emoji || '✅',
      is_active: true
    })
    
    const habit = await createHabit(userId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      emoji: emoji || '✅',
      is_active: true
    })

    console.log('API: [CREATE HABIT] Successfully created habit:', {
      id: habit.id,
      user_id: habit.user_id,
      name: habit.name
    })

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create habit' },
      { status: 500 }
    )
  }
}