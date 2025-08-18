import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  updateHabit,
  deleteHabit
} from '@/lib/database'

// PUT /api/habits/[id] - Update a habit
export async function PUT(
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

    const { name, description, emoji, reminder_time, is_active } = await request.json()

    // Validate habit name if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
        return NextResponse.json(
          { error: 'Habit name must be between 1 and 100 characters' },
          { status: 400 }
        )
      }
    }

    // Validate description if provided
    if (description !== undefined && typeof description === 'string' && description.length > 255) {
      return NextResponse.json(
        { error: 'Description must be less than 255 characters' },
        { status: 400 }
      )
    }

    // Validate emoji if provided
    if (emoji !== undefined && (typeof emoji !== 'string' || emoji.length > 10)) {
      return NextResponse.json(
        { error: 'Invalid emoji format' },
        { status: 400 }
      )
    }

    // Validate reminder_time format if provided (HH:MM format)
    if (reminder_time !== undefined && typeof reminder_time === 'string') {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(reminder_time)) {
        return NextResponse.json(
          { error: 'Invalid reminder time format. Use HH:MM (24-hour format)' },
          { status: 400 }
        )
      }
    }

    // Build updates object
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (emoji !== undefined) updates.emoji = emoji
    if (reminder_time !== undefined) updates.reminder_time = reminder_time || null
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    // Update the habit
    const habit = await updateHabit(id, userId, updates)

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update habit' },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
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

    await deleteHabit(id, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}