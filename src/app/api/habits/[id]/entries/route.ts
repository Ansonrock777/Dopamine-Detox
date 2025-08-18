import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getHabitEntries } from '@/lib/database'

// GET /api/habits/[id]/entries - Get habit entries for calendar visualization
export async function GET(
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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Validate date formats if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        { error: 'Invalid start_date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid end_date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Get habit entries
    const entries = await getHabitEntries(id, userId, startDate || undefined, endDate || undefined)

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error getting habit entries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get habit entries' },
      { status: 500 }
    )
  }
}