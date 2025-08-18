import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { toggleHabitCompletion } from '@/lib/database'
import { getTodayLocalDate } from '@/lib/timezone'

// POST /api/habits/[id]/toggle - Toggle habit completion for today or specific date
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { date } = body

    // Validate date format if provided (YYYY-MM-DD)
    if (date && typeof date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
      
      // Additional validation: check if date is valid
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== date) {
        return NextResponse.json(
          { error: 'Invalid date provided' },
          { status: 400 }
        )
      }
    }

    // Toggle habit completion (defaults to today if no date provided)
    const completed = await toggleHabitCompletion(
      id, 
      userId, 
      date // The function will handle default date with proper timezone
    )

    return NextResponse.json({ 
      success: true, 
      completed,
      date: date || getTodayLocalDate()
    })
  } catch (error) {
    console.error('Error toggling habit completion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle habit completion' },
      { status: 500 }
    )
  }
}