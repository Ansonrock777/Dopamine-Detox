import { supabase, supabaseAdmin } from './supabase'
import type { BlockedWebsite, FocusPreset, Timer, WebsiteRule, Habit, HabitStats, HabitOverview, HabitWithStats, HabitCalendarEntry, HabitEntry } from '@/types'
import { getTodayLocalDate } from './timezone'
import { calculateHabitStats } from './streak-utils'

// Helper to set user context for RLS when using Clerk
const setUserContext = async (userId: string) => {
  try {
    console.log('DB: Setting user context for RLS with userId:', userId)
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId })
    if (error) {
      console.error('DB: Failed to set user context for RLS:', error)
      console.error('DB: RLS Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`RLS context setup failed: ${error.message}`)
    } else {
      console.log('DB: RLS user context set successfully')
    }
  } catch (error) {
    console.error('DB: RLS function error:', error)
    throw error
  }
}

// Blocked Websites
export async function getBlockedWebsites(userId: string): Promise<BlockedWebsite[]> {
  try {
    console.log('Getting blocked websites for user:', userId)
    
    // Try admin client first
    if (supabaseAdmin) {
      console.log('Trying admin client for blocked websites...')
      try {
        const { data, error } = await supabaseAdmin
          .from('blocked_websites')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!error) {
          console.log('Blocked websites found via admin:', data?.length || 0)
          return data || []
        } else {
          console.error('Admin query error for blocked websites:', error)
        }
      } catch (adminError) {
        console.error('Admin client error for blocked websites:', adminError)
      }
    }
    
    // Fallback to RLS context
    try {
      console.log('Trying RLS for blocked websites...')
      await setUserContext(userId)
      const { data, error } = await supabase
        .from('blocked_websites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('RLS query error for blocked websites:', error)
        // Don't throw here - return empty array as fallback
        console.warn('Returning empty array due to RLS query error')
        return []
      }
      
      console.log('Blocked websites found via RLS:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('RLS attempt failed for blocked websites:', error)
      // Return empty array instead of throwing
      console.warn('Returning empty array due to RLS failure')
      return []
    }
  } catch (error) {
    console.error('Error in getBlockedWebsites:', error)
    // Return empty array as final fallback instead of throwing
    console.warn('Returning empty array as final fallback')
    return []
  }
}

export async function addBlockedWebsite(userId: string, url: string, isAlwaysOn: boolean = false): Promise<BlockedWebsite> {
  try {
    console.log('Adding blocked website for user:', userId, 'url:', url)
    
    // First try using the safe function
    const { data, error } = await supabase.rpc('safe_add_blocked_website', {
      p_user_id: userId,
      p_url: url.trim(),
      p_is_always_on: isAlwaysOn
    })
    
    if (error) {
      console.error('Safe function failed, trying direct insert:', error)
      
      // Try admin client first if available
      if (supabaseAdmin) {
        console.log('Trying admin client for blocked website insert...')
        try {
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('blocked_websites')
            .insert([{ user_id: userId, url: url.trim(), is_always_on: isAlwaysOn }])
            .select()
            .single()

          if (!adminError) {
            console.log('Blocked website added via admin client:', adminData.id)
            return adminData
          } else {
            console.error('Admin insert error:', adminError)
          }
        } catch (adminError) {
          console.error('Admin client error:', adminError)
        }
      }
      
      // Fallback to direct insert with RLS context
      console.log('Trying RLS fallback for blocked website insert...')
      try {
        await setUserContext(userId)
        const { data: directData, error: directError } = await supabase
          .from('blocked_websites')
          .insert([{ user_id: userId, url: url.trim(), is_always_on: isAlwaysOn }])
          .select()
          .single()

        if (directError) {
          console.error('RLS insert error:', directError)
          throw directError
        }
        
        console.log('Blocked website added via RLS:', directData.id)
        return directData
      } catch (rlsError) {
        console.error('RLS insert failed:', rlsError)
        throw rlsError
      }
    }
    
    console.log('Blocked website added via safe function:', data.id)
    return data
  } catch (error) {
    console.error('Error adding blocked website:', error)
    throw error
  }
}

export async function toggleBlockedWebsiteAlwaysOn(id: string, userId: string, isAlwaysOn: boolean): Promise<void> {
  console.log('Toggling blocked website:', id, 'isAlwaysOn:', isAlwaysOn)
  
  // Try admin client first
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('blocked_websites')
        .update({ is_always_on: isAlwaysOn })
        .eq('id', id)
        .eq('user_id', userId) // Additional security check

      if (!error) {
        console.log('Website toggled via admin client')
        return
      } else {
        console.error('Admin toggle error:', error)
      }
    } catch (adminError) {
      console.error('Admin client error for toggle:', adminError)
    }
  }
  
  // Fallback to RLS
  try {
    await setUserContext(userId)
    const { error } = await supabase
      .from('blocked_websites')
      .update({ is_always_on: isAlwaysOn })
      .eq('id', id)

    if (error) {
      console.error('RLS toggle error:', error)
      throw error
    }
    
    console.log('Website toggled via RLS')
  } catch (error) {
    console.error('Toggle failed:', error)
    throw error
  }
}

export async function removeBlockedWebsite(id: string, userId: string): Promise<void> {
  console.log('Removing blocked website:', id)
  
  // Try admin client first
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('blocked_websites')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Additional security check

      if (!error) {
        console.log('Website removed via admin client')
        return
      } else {
        console.error('Admin remove error:', error)
      }
    } catch (adminError) {
      console.error('Admin client error for remove:', adminError)
    }
  }
  
  // Fallback to RLS
  try {
    await setUserContext(userId)
    const { error } = await supabase
      .from('blocked_websites')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('RLS remove error:', error)
      throw error
    }
    
    console.log('Website removed via RLS')
  } catch (error) {
    console.error('Remove failed:', error)
    throw error
  }
}


// Focus Presets
export async function getFocusPresets(userId: string): Promise<FocusPreset[]> {
  try {
    await setUserContext(userId)
    const { data, error } = await supabase
      .from('focus_presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching focus presets:', error)
      throw new Error(`Failed to fetch focus presets: ${error.message}`)
    }
    return data || []
  } catch (error) {
    console.error('Error in getFocusPresets:', error)
    throw error
  }
}

export async function addFocusPreset(
  userId: string,
  preset: Omit<FocusPreset, 'id' | 'user_id' | 'created_at'>
): Promise<FocusPreset> {
  await setUserContext(userId)
  const { data, error } = await supabase
    .from('focus_presets')
    .insert([{ user_id: userId, ...preset }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFocusPreset(
  id: string,
  userId: string,
  updates: Partial<Omit<FocusPreset, 'id' | 'user_id' | 'created_at'>>
): Promise<FocusPreset> {
  await setUserContext(userId)
  const { data, error } = await supabase
    .from('focus_presets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeFocusPreset(id: string, userId: string): Promise<void> {
  await setUserContext(userId)
  const { error } = await supabase
    .from('focus_presets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Timers
export async function getTimers(userId: string): Promise<Timer[]> {
  try {
    await setUserContext(userId)
    const { data, error } = await supabase
      .from('timers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching timers:', error)
      throw new Error(`Failed to fetch timers: ${error.message}`)
    }
    return data || []
  } catch (error) {
    console.error('Error in getTimers:', error)
    throw error
  }
}

export async function upsertTimer(
  userId: string,
  timer: Omit<Timer, 'id' | 'user_id' | 'created_at'>
): Promise<Timer> {
  await setUserContext(userId)
  const { data, error } = await supabase
    .from('timers')
    .upsert(
      { user_id: userId, ...timer },
      { onConflict: 'user_id,type' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// Website Rules (Custom Focus Mode)
export async function getWebsiteRules(userId: string): Promise<WebsiteRule[]> {
  try {
    await setUserContext(userId)
    const { data, error } = await supabase
      .from('website_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching website rules:', error)
      throw new Error(`Failed to fetch website rules: ${error.message}`)
    }
    return data || []
  } catch (error) {
    console.error('Error in getWebsiteRules:', error)
    throw error
  }
}

export async function addWebsiteRule(
  userId: string,
  rule: Omit<WebsiteRule, 'id' | 'user_id' | 'created_at'>
): Promise<WebsiteRule> {
  try {
    console.log('Adding website rule for userId:', userId, 'rule:', rule)
    
    // First try using the safe function
    const { data, error } = await supabase.rpc('safe_add_website_rule', {
      p_user_id: userId,
      p_url: rule.url,
      p_start_time: rule.start_time,
      p_end_time: rule.end_time,
      p_action: rule.action,
      p_is_active: rule.is_active ?? true
    })
    
    if (error) {
      console.error('Safe function failed, trying direct insert:', error)
      // Fallback to direct insert with RLS context
      await setUserContext(userId)
      
      const insertData = { user_id: userId, ...rule }
      console.log('Inserting website rule with data:', insertData)
      
      const { data: directData, error: directError } = await supabase
        .from('website_rules')
        .insert([insertData])
        .select()
        .single()

      if (directError) {
        console.error('Supabase error inserting website rule:', {
          message: directError.message,
          code: directError.code,
          hint: directError.hint,
          details: directError.details
        })
        throw new Error(`Database error: ${directError.message} (Code: ${directError.code})`)
      }
      
      console.log('Successfully inserted website rule:', directData)
      return directData
    }
    
    console.log('Successfully inserted website rule via safe function:', data)
    return data
  } catch (error) {
    console.error('Error in addWebsiteRule:', {
      userId,
      rule,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
    throw error
  }
}

export async function updateWebsiteRule(
  id: string,
  userId: string,
  updates: Partial<Omit<WebsiteRule, 'id' | 'user_id' | 'created_at'>>
): Promise<WebsiteRule> {
  try {
    await setUserContext(userId)
    console.log('Updating website rule:', { id, updates })
    const { data, error } = await supabase
      .from('website_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating website rule:', error)
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
    }
    return data
  } catch (error) {
    console.error('Error in updateWebsiteRule:', error)
    throw error
  }
}

export async function toggleWebsiteRule(id: string, userId: string, isActive: boolean): Promise<void> {
  await setUserContext(userId)
  const { error } = await supabase
    .from('website_rules')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export async function removeWebsiteRule(id: string, userId: string): Promise<void> {
  await setUserContext(userId)
  const { error } = await supabase
    .from('website_rules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================
// HABIT TRACKING OPERATIONS
// =============================================

// Get all habits for a user
export async function getHabits(userId: string): Promise<Habit[]> {
  try {
    console.log('Getting habits for user:', userId)
    
    // Try admin client first
    if (supabaseAdmin) {
      console.log('Trying admin client for habits...')
      try {
        const { data, error } = await supabaseAdmin
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!error) {
          console.log('Habits found via admin:', data?.length || 0)
          return data || []
        } else {
          console.error('Admin query error for habits:', error)
        }
      } catch (adminError) {
        console.error('Admin client error for habits:', adminError)
      }
    }
    
    // Fallback to RLS context
    try {
      console.log('Trying RLS for habits...')
      await setUserContext(userId)
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('RLS query error for habits:', error)
        throw new Error(`Failed to fetch habits: ${error.message}`)
      }
      
      console.log('Habits found via RLS:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error in getHabits:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in getHabits:', error)
    throw error
  }
}

// Create a new habit
export async function createHabit(userId: string, habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'start_date'>): Promise<Habit> {
  try {
    console.log('Creating habit for user:', userId, 'data:', habitData)
    
    // Try using the safe function first
    const { data, error } = await supabase.rpc('safe_create_habit', {
      p_user_id: userId,
      p_name: habitData.name,
      p_description: habitData.description || null,
      p_emoji: habitData.emoji || '✅'
    })
    
    if (error) {
      console.error('Safe function failed, trying direct insert:', error)
      
      // Try admin client first if available
      if (supabaseAdmin) {
        console.log('Trying admin client for habit insert...')
        try {
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('habits')
            .insert([{ user_id: userId, ...habitData }])
            .select()
            .single()

          if (!adminError) {
            console.log('Habit created via admin client:', adminData.id)
            return adminData
          } else {
            console.error('Admin insert error:', adminError)
          }
        } catch (adminError) {
          console.error('Admin client error:', adminError)
        }
      }
      
      // Fallback to direct insert with RLS context
      console.log('Trying RLS fallback for habit insert...')
      try {
        await setUserContext(userId)
        const { data: directData, error: directError } = await supabase
          .from('habits')
          .insert([{ user_id: userId, ...habitData }])
          .select()
          .single()

        if (directError) {
          console.error('RLS insert error:', directError)
          throw directError
        }
        
        console.log('Habit created via RLS:', directData.id)
        return directData
      } catch (rlsError) {
        console.error('RLS insert failed:', rlsError)
        throw rlsError
      }
    }
    
    console.log('Habit created via safe function:', data.id)
    return data
  } catch (error) {
    console.error('Error creating habit:', error)
    throw error
  }
}

// Update a habit
export async function updateHabit(habitId: string, userId: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Habit> {
  try {
    console.log('Updating habit:', habitId, 'updates:', updates)
    
    // Try admin client first
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('habits')
          .update(updates)
          .eq('id', habitId)
          .eq('user_id', userId) // Additional security check
          .select()
          .single()

        if (!error) {
          console.log('Habit updated via admin client:', data.id)
          return data
        } else {
          console.error('Admin update error:', error)
        }
      } catch (adminError) {
        console.error('Admin client error for update:', adminError)
      }
    }
    
    // Fallback to RLS
    try {
      await setUserContext(userId)
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single()

      if (error) {
        console.error('RLS update error:', error)
        throw error
      }
      
      console.log('Habit updated via RLS:', data.id)
      return data
    } catch (error) {
      console.error('Update failed:', error)
      throw error
    }
  } catch (error) {
    console.error('Error updating habit:', error)
    throw error
  }
}

// Delete a habit (soft delete by setting is_active to false)
export async function deleteHabit(habitId: string, userId: string): Promise<void> {
  try {
    console.log('Deleting habit:', habitId)
    
    // Try admin client first
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('habits')
          .update({ is_active: false })
          .eq('id', habitId)
          .eq('user_id', userId) // Additional security check

        if (!error) {
          console.log('Habit deleted via admin client')
          return
        } else {
          console.error('Admin delete error:', error)
        }
      } catch (adminError) {
        console.error('Admin client error for delete:', adminError)
      }
    }
    
    // Fallback to RLS
    try {
      await setUserContext(userId)
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)

      if (error) {
        console.error('RLS delete error:', error)
        throw error
      }
      
      console.log('Habit deleted via RLS')
    } catch (error) {
      console.error('Delete failed:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting habit:', error)
    throw error
  }
}

// Toggle habit completion for a specific date
export async function toggleHabitCompletion(habitId: string, userId: string, date?: string): Promise<boolean> {
  // Use user's local timezone for default date
  if (!date) {
    date = getTodayLocalDate();
  }
  try {
    console.log('Toggling habit completion:', habitId, 'date:', date)
    
    // Use the safe function
    const { data, error } = await supabase.rpc('safe_toggle_habit_completion', {
      p_user_id: userId,
      p_habit_id: habitId,
      p_completion_date: date
    })
    
    if (error) {
      console.error('Toggle completion failed:', error)
      throw error
    }
    
    console.log('Habit completion toggled, new status:', data)
    return data
  } catch (error) {
    console.error('Error toggling habit completion:', error)
    throw error
  }
}

// Get habit entries for calendar visualization
export async function getHabitEntries(habitId: string, userId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
  try {
    console.log('Getting habit entries for habit:', habitId)
    
    const client = supabaseAdmin ?? supabase
    let query = client
      .from('habit_entries')
      .select('id, habit_id, user_id, completion_date, completed')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completion_date', { ascending: true })
    
    if (startDate) {
      query = query.gte('completion_date', startDate)
    }
    if (endDate) {
      query = query.lte('completion_date', endDate)
    }
    
    // Set user context for RLS
    await setUserContext(userId)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching habit entries:', error)
      throw new Error(`Failed to fetch habit entries: ${error.message}`)
    }
    
    return (data || []).map(entry => ({
      id: entry.id,
      habit_id: entry.habit_id,
      user_id: entry.user_id,
      completion_date: entry.completion_date,
      completed: entry.completed,
      created_at: entry.completion_date + 'T00:00:00.000Z',
      updated_at: entry.completion_date + 'T00:00:00.000Z'
    })) as HabitEntry[]
  } catch (error) {
    console.error('Error in getHabitEntries:', error)
    throw error
  }
}

// Get habit statistics using frontend calculations
export async function getHabitStats(habitId: string, userId: string): Promise<HabitStats> {
  try {
    console.log('Getting habit stats for habit:', habitId)
    
    // Get all habit entries for this habit
    const entries = await getHabitEntries(habitId, userId)
    
    // Get habit details to get the start_date using admin client
    const adminOrClient = supabaseAdmin ?? supabase
    const { data: habitData, error: habitError } = await adminOrClient
      .from('habits')
      .select('start_date')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single()
    
    if (habitError) {
      console.error('Error fetching habit details:', habitError)
      throw new Error(`Failed to fetch habit details: ${habitError.message}`)
    }
    
    // Calculate stats using frontend logic
    const stats = calculateHabitStats(habitId, entries, habitData.start_date)
    
    return stats
  } catch (error) {
    console.error('Error in getHabitStats:', error)
    throw error
  }
}

// Get user's overall habit statistics using frontend calculations
export async function getUserHabitOverview(userId: string): Promise<HabitOverview> {
  try {
    console.log('Getting user habit overview for:', userId)
    
    // Get all habits for the user
    const habits = await getHabits(userId)
    
    if (habits.length === 0) {
      return {
        total_habits: 0,
        min_current_streak: 0,
        avg_consistency: 0,
        highest_badge: 'none' as const
      }
    }
    
    // Calculate stats for each habit using frontend logic
    const allStats = await Promise.all(
      habits.map(async (habit) => {
        const entries = await getHabitEntries(habit.id, userId)
        return calculateHabitStats(habit.id, entries, habit.start_date)
      })
    )
    
    // Calculate overview metrics
    const totalHabits = habits.length
    const minCurrentStreak = Math.min(...allStats.map(s => s.current_streak))
    const avgConsistency = allStats.reduce((sum, s) => sum + s.consistency_percent, 0) / totalHabits
    
    // Find highest badge level
    const badgeOrder = ['none', 'getting_started', 'spark', 'steady', 'on_fire', 'unstoppable']
    const highestBadge = allStats.reduce<'none' | 'getting_started' | 'spark' | 'steady' | 'on_fire' | 'unstoppable'>((highest, current) => {
      const currentIndex = badgeOrder.indexOf(current.badge_level)
      const highestIndex = badgeOrder.indexOf(highest)
      return currentIndex > highestIndex ? current.badge_level : highest
    }, 'none')
    
    return {
      total_habits: totalHabits,
      min_current_streak: minCurrentStreak,
      avg_consistency: avgConsistency,
      highest_badge: highestBadge
    }
  } catch (error) {
    console.error('Error in getUserHabitOverview:', error)
    throw error
  }
}

// Get habits with their stats and today's completion status
// Get habit calendar data using the new database function
export async function getHabitCalendarData(userId: string, habitId: string, startDate: string, endDate: string): Promise<HabitCalendarEntry[]> {
  try {
    console.log('Getting habit calendar data:', { habitId, startDate, endDate })
    
    // Try the new database function for calendar data
    try {
      const { data, error } = await supabase.rpc('get_habit_calendar_data', {
        p_user_id: userId,
        p_habit_id: habitId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      
      if (error) {
        throw error
      }
      
      return (data || []).map((entry: { date: string; completed: boolean }) => ({
        date: entry.date,
        completed: entry.completed
      }))
    } catch (newFunctionError) {
      console.log('New calendar function not available, falling back to getHabitEntries:', newFunctionError)
      
      // Fallback to the original getHabitEntries function
      const entries = await getHabitEntries(habitId, userId, startDate, endDate)
      return entries.map(e => ({ date: e.completion_date, completed: e.completed }))
    }
  } catch (error) {
    console.error('Error in getHabitCalendarData:', error)
    throw error
  }
}

// Get habits with today's completion status using the new function
export async function getHabitsWithTodayStatus(userId: string): Promise<HabitWithStats[]> {
  try {
    console.log('DB: Getting habits with today status for user:', userId)
    
    // First, set the user context for RLS
    console.log('DB: Setting user context for RLS...')
    await setUserContext(userId)
    
    // Use the new database function
    console.log('DB: Calling get_habits_with_today_status function...')
    const { data, error } = await supabase.rpc('get_habits_with_today_status', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('DB: Error fetching habits with today status:', error)
      console.error('DB: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to fetch habits with today status: ${error.message}`)
    }
    
    console.log('DB: Raw data from function:', data)
    console.log('DB: Number of habits found:', data?.length || 0)
    
    // Get stats for each habit
    const habitsWithStats = await Promise.all(
      (data || []).map(async (habit: Habit & { today_completed: boolean }) => {
        console.log('DB: Getting stats for habit:', habit.id, habit.name)
        const stats = await getHabitStats(habit.id, userId)
        return {
          ...habit,
          stats,
          today_completed: habit.today_completed
        }
      })
    )
    
    console.log('DB: Final habits with stats:', habitsWithStats.length)
    return habitsWithStats
  } catch (error) {
    console.error('DB: Error in getHabitsWithTodayStatus:', error)
    throw error
  }
}

export async function getHabitsWithStats(userId: string): Promise<HabitWithStats[]> {
  try {
    console.log('DB: getHabitsWithStats - using direct database queries for reliability')
    console.log('DB: User ID received:', userId)
    
    // TEMPORARY: Use admin client to bypass RLS and see if habits exist
    if (!supabaseAdmin) {
      throw new Error('Admin client not available - cannot bypass RLS')
    }
    
    console.log('DB: Using admin client to bypass RLS and check if habits exist...')
    const { data: adminHabits, error: adminError } = await supabaseAdmin
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    console.log('DB: Admin query (bypassing RLS) found:', adminHabits?.length || 0, 'habits')
    if (adminError) {
      console.error('DB: Admin query error:', adminError)
    }
    
    // If no habits exist, return empty array
    if (!adminHabits || adminHabits.length === 0) {
      console.log('DB: No habits found for user, returning empty array')
      return []
    }
    
    // If no habits found, let's check ALL habits for debugging
    if (!adminHabits || adminHabits.length === 0) {
      console.log('DB: No habits found for user, checking ALL habits in database...')
      const { data: allHabits, error: allError } = await supabaseAdmin
        .from('habits')
        .select('user_id, name, is_active')
        .limit(10)
      
      console.log('DB: All habits in database (first 10):', allHabits)
      console.log('DB: Looking for user_id:', userId)
    }
    
    // Use admin results temporarily
    const habits = adminHabits || []
    
    if (habits.length === 0) {
      console.log('DB: No habits found, returning empty array')
      return []
    }
    
    console.log('DB: Found habits:', habits.length)
    
    // Get today's completion status for all habits using admin client
    const todayString = getTodayLocalDate()
    console.log('DB: Fetching today\'s completions for date:', todayString)
    
    const { data: todayEntries, error: entriesError } = await supabaseAdmin
      .from('habit_entries')
      .select('habit_id, completed')
      .eq('user_id', userId)
      .eq('completion_date', todayString)
    
    if (entriesError) {
      console.error('DB: Error fetching today\'s entries:', entriesError)
      // Don't throw, just continue without today's status
    }
    
    console.log('DB: Found today\'s entries:', todayEntries?.length || 0)
    
    // Create a map for quick lookup
    const todayCompletionMap = new Map(
      todayEntries?.map(entry => [entry.habit_id, entry.completed]) || []
    )
    
    // Get stats for each habit and combine
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        console.log('DB: Getting stats for habit:', habit.id, habit.name)
        
        // Simplified stats calculation to avoid errors
        const stats: HabitStats = {
          habit_id: habit.id,
          current_streak: 0,
          max_streak: 0,
          consistency_percent: 0,
          total_checkins: 0,
          badge_level: 'none' as const
        }
        
        console.log('DB: Attempting to get full stats for habit:', habit.id)
        const fullStats = await getHabitStats(habit.id, userId)
        console.log('DB: Got full stats:', fullStats)
        Object.assign(stats, fullStats)
        
        const today_completed = todayCompletionMap.get(habit.id) || false
        
        return {
          ...habit,
          stats,
          today_completed
        }
      })
    )
    
    // Sort: uncompleted first, then by creation date
    const sortedHabits = habitsWithStats.sort((a, b) => {
      if (a.today_completed !== b.today_completed) {
        return a.today_completed ? 1 : -1
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    
    console.log('DB: Final sorted habits:', sortedHabits.length)
    return sortedHabits
    
  } catch (error) {
    console.error('DB: Error in getHabitsWithStats:', error)
    throw error
  }
}

// Export functionality for NextDNS integration
export async function exportUserConfig(userId: string) {
  const [blockedSites, presets] = await Promise.all([
    getBlockedWebsites(userId),
    getFocusPresets(userId),
  ])

  return {
    version: '2.0',
    exported_at: new Date().toISOString(),
    blocklist: blockedSites.map(site => site.url),
    categories: [], // Will be populated when NextDNS categories are implemented
    timers: [
      { type: 'blocking' as const, duration_minutes: 25 }
    ],
    presets: presets.map(preset => ({
      name: preset.name,
      start_time: preset.start_time,
      end_time: preset.end_time,
      blocking_duration: preset.blocking_duration,
      blocked_websites: preset.blocked_websites,
    }))
  }
}