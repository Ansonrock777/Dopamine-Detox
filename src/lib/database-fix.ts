// Temporary bypass for RLS issues - use this for testing
import { supabase } from './supabase'
import type { WebsiteRule } from '@/types'

// Direct database operations without RLS for testing
export async function addWebsiteRuleDirectly(
  userId: string,
  rule: Omit<WebsiteRule, 'id' | 'user_id' | 'created_at'>
): Promise<WebsiteRule> {
  try {
    console.log('Direct insert - bypassing RLS temporarily')
    console.log('User ID:', userId)
    console.log('Rule data:', rule)
    
    // Disable RLS temporarily for this session
    const { error: rlsError } = await supabase.rpc('set_config', {
      setting_name: 'row_security',
      new_value: 'off',
      is_local: true
    })
    
    if (rlsError) {
      console.warn('Could not disable RLS:', rlsError)
    }
    
    const insertData = { 
      user_id: userId, 
      url: rule.url,
      start_time: rule.start_time,
      end_time: rule.end_time,
      action: rule.action,
      is_active: rule.is_active ?? true
    }
    
    console.log('Inserting data:', insertData)
    
    const { data, error } = await supabase
      .from('website_rules')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Direct insert error:', error)
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
    }
    
    console.log('Successfully inserted:', data)
    return data
  } catch (error) {
    console.error('Error in direct insert:', error)
    throw error
  }
}

// Test if RLS function exists
export async function testRLSFunction(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId })
    if (error) {
      console.error('RLS function exists but failed:', error)
      return false
    }
    console.log('RLS function works!')
    return true
  } catch (error) {
    console.error('RLS function does not exist:', error)
    return false
  }
}