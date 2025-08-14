import { supabase, supabaseAdmin } from './supabase'
import type { BlockedWebsite, FocusPreset, Timer, WebsiteRule } from '@/types'

// Helper to set user context for RLS when using Clerk
const setUserContext = async (userId: string) => {
  try {
    console.log('Setting user context for RLS with userId:', userId)
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId })
    if (error) {
      console.error('Failed to set user context for RLS:', error)
      // For now, we'll continue without throwing to test if the function exists
      console.warn('Continuing without RLS context - this might cause permission issues')
    }
  } catch (error) {
    console.error('RLS function error:', error)
    // Don't throw for now - let's see if the function exists
    console.warn('RLS function not available - falling back to direct database access')
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
        throw new Error(`Failed to fetch blocked websites: ${error.message}`)
      }
      
      console.log('Blocked websites found via RLS:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error in getBlockedWebsites:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in getBlockedWebsites:', error)
    throw error
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