/**
 * NextDNS Database Operations
 * 
 * Database functions for managing NextDNS integration,
 * including accounts, categories, and sync operations.
 */

import { supabase, supabaseAdmin } from './supabase'
import { NextDNSClient, validateNextDNSApiKey, testNextDNSConnection } from './nextdns'

// Helper to set user context for RLS when using Clerk
const setUserContext = async (userId: string) => {
  try {
    console.log('Setting user context for RLS with userId:', userId)
    const { error } = await supabase.rpc('set_current_user_id', { user_id: userId })
    if (error) {
      console.error('Failed to set user context for RLS:', error)
      console.error('RLS error details:', { code: error.code, message: error.message, details: error.details })
      throw new Error(`RLS context setup failed: ${error.message}`)
    }
    console.log('RLS context set successfully')
    return true
  } catch (error) {
    console.error('RLS function error:', error)
    return false
  }
}

// Enhanced helper that tries admin client first, then RLS
const executeWithContext = async <T>(
  userId: string,
  operation: (client: typeof supabase | typeof supabaseAdmin) => Promise<T>,
  operationName: string
): Promise<T> => {
  // Try admin client first if available
  if (supabaseAdmin) {
    try {
      console.log(`Trying admin client for ${operationName}...`)
      const result = await operation(supabaseAdmin)
      console.log(`Admin client succeeded for ${operationName}`)
      return result
    } catch (adminError) {
      console.warn(`Admin client failed for ${operationName}:`, adminError)
      // Fall through to RLS attempt
    }
  }
  
  // Fallback to RLS context
  try {
    console.log(`Trying RLS for ${operationName}...`)
    const rlsSet = await setUserContext(userId)
    if (!rlsSet) {
      throw new Error('Failed to set RLS context')
    }
    
    const result = await operation(supabase)
    console.log(`RLS succeeded for ${operationName}`)
    return result
  } catch (rlsError) {
    console.error(`RLS failed for ${operationName}:`, rlsError)
    throw new Error(`Database operation failed: ${operationName}. Error: ${rlsError instanceof Error ? rlsError.message : String(rlsError)}`)
  }
}

// Types
export interface NextDNSAccount {
  id: string
  user_id: string
  api_key: string
  profile_id: string
  profile_name: string
  is_active: boolean
  last_sync: string
  created_at: string
  updated_at: string
}

export interface NextDNSCategory {
  id: string
  user_id: string
  category_id: string
  category_name: string
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface NextDNSSyncLog {
  id: string
  user_id: string
  operation: string
  resource_type: string
  resource_id: string
  status: 'pending' | 'success' | 'failed'
  error_message?: string
  created_at: string
}

// NextDNS Account Management
export async function getNextDNSAccount(userId: string): Promise<NextDNSAccount | null> {
  try {
    console.log('Getting NextDNS account for user:', userId)
    
    // Try admin client first since we know it works and data exists
    if (supabaseAdmin) {
      console.log('Trying admin client first...')
      try {
        const { data, error } = await supabaseAdmin
          .from('nextdns_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No NextDNS account found for user via admin:', userId)
            return null
          }
          console.error('Admin query error:', error)
          // Fall through to RLS attempt
        } else {
          console.log('NextDNS account found via admin:', { id: data.id, profile_id: data.profile_id, is_active: data.is_active })
          return data
        }
      } catch (adminError) {
        console.error('Admin client error:', adminError)
        // Fall through to RLS attempt
      }
    }
    
    // Fallback to RLS context (though we know it's failing)
    try {
      console.log('Trying RLS as fallback...')
      await setUserContext(userId)
      const { data, error } = await supabase
        .from('nextdns_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No NextDNS account found for user via RLS:', userId)
          return null
        }
        console.error('RLS query error:', error)
        return null
      }
      
      console.log('NextDNS account found via RLS:', { id: data.id, profile_id: data.profile_id, is_active: data.is_active })
      return data
    } catch (rlsError) {
      console.warn('RLS query failed:', rlsError)
      return null
    }
  } catch (error) {
    console.error('Error in getNextDNSAccount:', error)
    return null
  }
}

export async function createNextDNSAccount(
  userId: string,
  apiKey: string,
  profileId: string,
  profileName: string = 'Dopamine Detox'
): Promise<NextDNSAccount> {
  try {
    console.log('Starting createNextDNSAccount with:', { userId, profileId, profileName })
    
    // Validate API key format
    console.log('Validating API key format...')
    if (!validateNextDNSApiKey(apiKey)) {
      console.error('API key validation failed for:', apiKey)
      throw new Error('Invalid NextDNS API key format. API key should be 40 characters long and contain only letters (a-f) and numbers (0-9).')
    }
    console.log('API key format validation passed')

    // Test connection to existing NextDNS account
    console.log('Testing NextDNS connection...')
    const isValid = await testNextDNSConnection(apiKey)
    if (!isValid) {
      console.error('NextDNS connection test failed')
      throw new Error('Unable to connect to your NextDNS account. Please verify your API key is correct and has the necessary permissions.')
    }
    console.log('NextDNS connection test passed')

    // Validate that the provided profileId actually exists in the account
    try {
      const client = new NextDNSClient(apiKey)
      const profiles = await client.getProfiles()
      const profileExists = profiles.some(p => p.id === profileId)
      if (!profileExists) {
        throw new Error(`Profile ID not found in your NextDNS account: ${profileId}`)
      }
      console.log('Provided profileId verified in NextDNS account')
    } catch (profileErr) {
      const message = profileErr instanceof Error ? profileErr.message : String(profileErr)
      console.error('Profile verification failed:', message)
      throw new Error(`Could not verify NextDNS profile. ${message}`)
    }

    console.log('Using admin client to bypass RLS...')
    if (!supabaseAdmin) {
      throw new Error('Service role key not configured. Cannot create NextDNS account.')
    }

    // Check if user profile exists, create if missing
    console.log('Checking if user profile exists...')
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (profileCheckError && profileCheckError.code === 'PGRST116') {
      // User profile doesn't exist, create it
      console.log('User profile not found, creating...')
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: userId,
          email: 'temp@example.com', // Temporary email, will be updated by webhook
          first_name: 'User',
          last_name: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (createProfileError) {
        console.error('Failed to create user profile:', createProfileError)
        throw new Error(`Failed to create user profile: ${createProfileError.message}`)
      }
      console.log('User profile created successfully')
    } else if (profileCheckError) {
      console.error('Error checking user profile:', profileCheckError)
      throw new Error(`Error checking user profile: ${profileCheckError.message}`)
    } else {
      console.log('User profile exists:', existingProfile)
    }

    console.log('Deactivating existing accounts...')
    const { error: deactivateError } = await supabaseAdmin
      .from('nextdns_accounts')
      .update({ is_active: false })
      .eq('user_id', userId)
    
    if (deactivateError) {
      console.error('Error deactivating existing accounts:', deactivateError)
    } else {
      console.log('Existing accounts deactivated successfully')
    }

    console.log('Creating new NextDNS account record...')
    const insertData = { 
      user_id: userId,
      api_key: apiKey,
      profile_id: profileId,
      profile_name: profileName,
      is_active: true
    }
    console.log('Insert data:', insertData)
    
    const { data, error } = await supabaseAdmin
      .from('nextdns_accounts')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      throw error
    }
    
    console.log('NextDNS account created successfully:', data)
    
    // Initialize categories for the new account
    console.log('🏗️ Initializing NextDNS categories for new account...')
    try {
      await initializeNextDNSCategories(userId)
      console.log('✅ Categories initialized for new NextDNS account')
    } catch (categoryError) {
      console.error('⚠️ Failed to initialize categories for new account:', categoryError)
      // Don't throw here - account creation succeeded, category init can be retried
    }
    
    return data
  } catch (error) {
    console.error('Error connecting NextDNS account:', error)
    throw error
  }
}

export async function updateNextDNSAccount(
  userId: string,
  updates: Partial<Pick<NextDNSAccount, 'api_key' | 'profile_id' | 'profile_name'>>
): Promise<NextDNSAccount> {
  try {
    await setUserContext(userId)
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('nextdns_accounts')
      .update(updateData)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating NextDNS account:', error)
    throw error
  }
}

export async function deleteNextDNSAccount(userId: string): Promise<void> {
  try {
    await setUserContext(userId)
    const { error } = await supabase
      .from('nextdns_accounts')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting NextDNS account:', error)
    throw error
  }
}

// NextDNS Categories Management
export async function getNextDNSCategories(userId: string): Promise<NextDNSCategory[]> {
  try {
    console.log('Getting NextDNS categories for user:', userId)
    
    return await executeWithContext(
      userId,
      async (client) => {
        const { data, error } = await client
          .from('nextdns_categories')
          .select('*')
          .eq('user_id', userId)
          .order('category_name', { ascending: true })

        if (error) {
          console.error('Database query error for categories:', error)
          throw error
        }
        
        console.log('NextDNS categories found:', data?.length || 0)
        return data || []
      },
      'getNextDNSCategories'
    )
  } catch (error) {
    console.error('Error in getNextDNSCategories:', error)
    // Don't throw here - return empty array as fallback
    return []
  }
}

export async function updateNextDNSCategory(
  userId: string,
  categoryId: string,
  isBlocked: boolean
): Promise<NextDNSCategory> {
  try {
    console.log(`Updating NextDNS category ${categoryId} to ${isBlocked ? 'blocked' : 'unblocked'} for user:`, userId)
    
    return await executeWithContext(
      userId,
      async (client) => {
        const { data, error } = await client
          .from('nextdns_categories')
          .update({ 
            is_blocked: isBlocked,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .select()
          .single()

        if (error) {
          console.error('Database update error for category:', error)
          throw error
        }
        
        if (!data) {
          throw new Error(`Category ${categoryId} not found for user ${userId}`)
        }
        
        console.log('NextDNS category updated successfully:', data)
        return data
      },
      'updateNextDNSCategory'
    )
  } catch (error) {
    console.error('Error updating NextDNS category:', error)
    throw error
  }
}

export async function initializeNextDNSCategories(userId: string): Promise<void> {
  try {
    console.log('Initializing NextDNS categories for user:', userId)
    
    // Use the exact categories from the updated schema
    const categories = [
      { category_id: 'porn', category_name: 'Porn' },
      { category_id: 'gambling', category_name: 'Gambling' },
      { category_id: 'dating', category_name: 'Dating' },
      { category_id: 'piracy', category_name: 'Piracy' },
      { category_id: 'social-networks', category_name: 'Social Networks' },
      { category_id: 'gaming', category_name: 'Online Gaming' }, // Changed from 'online-gaming' to 'gaming'
      { category_id: 'video-streaming', category_name: 'Video Streaming' },
    ]

    await executeWithContext(
      userId,
      async (client) => {
        const { error } = await client
          .from('nextdns_categories')
          .upsert(
            categories.map(cat => ({
              user_id: userId,
              category_id: cat.category_id,
              category_name: cat.category_name,
              is_blocked: false
            })),
            { 
              onConflict: 'user_id,category_id',
              ignoreDuplicates: true
            }
          )

        if (error) {
          console.error('Database upsert error for categories:', error)
          throw error
        }
        
        console.log('NextDNS categories initialized successfully')
        return true
      },
      'initializeNextDNSCategories'
    )
  } catch (error) {
    console.error('Error initializing NextDNS categories:', error)
    throw error
  }
}

// Sync Operations
export async function syncWithNextDNS(userId: string): Promise<void> {
  try {
    console.log('🔄 Starting NextDNS sync for user:', userId)
    
    // Get NextDNS account
    const account = await getNextDNSAccount(userId)
    if (!account) {
      const error = new Error('No NextDNS account configured. Please connect your NextDNS account first.')
      console.error('❌ NextDNS sync failed - no account:', userId)
      await logNextDNSOperation(userId, 'sync', 'profile', 'none', 'failed', error.message)
      throw error
    }

    console.log('✅ NextDNS account found:', { 
      profile_id: account.profile_id, 
      profile_name: account.profile_name,
      is_active: account.is_active 
    })

    // Validate account is active
    if (!account.is_active) {
      const error = new Error('NextDNS account is inactive. Please reactivate your account.')
      console.error('❌ NextDNS sync failed - account inactive:', userId)
      await logNextDNSOperation(userId, 'sync', 'profile', account.profile_id, 'failed', error.message)
      throw error
    }

    // Initialize categories if none exist
    console.log('🔍 Checking user categories...')
    let categories = await getNextDNSCategories(userId)
    if (categories.length === 0) {
      console.log('📋 No categories found, initializing...')
      await initializeNextDNSCategories(userId)
      categories = await getNextDNSCategories(userId)
      console.log('✅ Categories initialized:', categories.length)
    }

    // Validate we have the expected 7 categories
    const expectedCategories = ['porn', 'gambling', 'dating', 'piracy', 'social-networks', 'gaming', 'video-streaming']
    const missingCategories = expectedCategories.filter(cat => !categories.some(c => c.category_id === cat))
    if (missingCategories.length > 0) {
      console.warn('⚠️ Missing expected categories:', missingCategories)
      console.log('🔧 Re-initializing categories to fix missing ones...')
      await initializeNextDNSCategories(userId)
      categories = await getNextDNSCategories(userId)
    }

    // Get user's blocking preferences
    console.log('📊 Fetching user blocking preferences...')
    const [blockedSites, refreshedCategories] = await Promise.all([
      getBlockedWebsites(userId),
      getNextDNSCategories(userId) // Refresh after potential initialization
    ])

    console.log('📈 User blocking data:', {
      blockedSites: blockedSites.length,
      categories: refreshedCategories.length,
      alwaysOnSites: blockedSites.filter(site => site.is_always_on).length,
      blockedCategories: refreshedCategories.filter(cat => cat.is_blocked).length
    })

    // Prepare data for sync
    const domainsToBlock = blockedSites
      .filter(site => site.is_always_on)
      .map(site => site.url)
      .filter(url => url && url.trim()) // Remove empty/invalid URLs

    const categoriesToBlock = refreshedCategories
      .filter(cat => cat.is_blocked)
      .map(cat => cat.category_id)
      .filter(catId => expectedCategories.includes(catId)) // Only sync valid categories

    console.log('🎯 Sync data prepared:', {
      domainsToBlock: domainsToBlock.length > 0 ? domainsToBlock : 'none',
      categoriesToBlock: categoriesToBlock.length > 0 ? categoriesToBlock : 'none',
      totalDomains: domainsToBlock.length,
      totalCategories: categoriesToBlock.length
    })

    // Validate NextDNS client before sync
    console.log('🔌 Creating NextDNS client and validating connection...')
    const client = new NextDNSClient(account.api_key)
    
    // Test connection first
    try {
      await client.getProfile(account.profile_id)
      console.log('✅ NextDNS connection validated')
    } catch (connectionError) {
      const error = new Error(`NextDNS connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`)
      console.error('❌ NextDNS connection test failed:', connectionError)
      await logNextDNSOperation(userId, 'sync', 'profile', account.profile_id, 'failed', error.message)
      throw error
    }

    // Perform the sync
    console.log('🚀 Starting NextDNS sync operation...')
    await client.syncUserBlocking(
      account.profile_id,
      domainsToBlock,
      categoriesToBlock,
      [] // Services will be implemented later
    )

    console.log('✅ NextDNS sync completed successfully')
    console.log('📊 Sync summary:', {
      profileId: account.profile_id,
      domainsSynced: domainsToBlock.length,
      categoriesSynced: categoriesToBlock.length,
      timestamp: new Date().toISOString()
    })

    // Log successful sync
    await logNextDNSOperation(
      userId, 
      'sync', 
      'profile', 
      account.profile_id, 
      'success',
      `Synced ${domainsToBlock.length} domains and ${categoriesToBlock.length} categories`
    )
  } catch (error) {
    console.error('❌ Error syncing with NextDNS:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('🔍 NextDNS sync error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    })
    
    // Log failed sync
    await logNextDNSOperation(
      userId, 
      'sync', 
      'profile', 
      'unknown', 
      'failed', 
      errorMessage
    )
    
    throw error
  }
}

export async function logNextDNSOperation(
  userId: string,
  operation: string,
  resourceType: string,
  resourceId: string,
  status: 'pending' | 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    console.log(`📝 Logging NextDNS operation: ${operation} ${resourceType} ${status}`)
    
    await executeWithContext(
      userId,
      async (client) => {
        const { error } = await client
          .from('nextdns_sync_log')
          .insert([{
            user_id: userId,
            operation,
            resource_type: resourceType,
            resource_id: resourceId,
            status,
            error_message: errorMessage
          }])

        if (error) {
          console.error('Database error logging NextDNS operation:', error)
          throw error
        }
        
        console.log('✅ NextDNS operation logged successfully')
        return true
      },
      'logNextDNSOperation'
    )
  } catch (error) {
    // Don't throw here - logging failures shouldn't break the main operation
    console.error('Error in logNextDNSOperation:', error)
  }
}

export async function getNextDNSSyncLog(userId: string): Promise<NextDNSSyncLog[]> {
  try {
    console.log('Getting NextDNS sync log for user:', userId)
    
    return await executeWithContext(
      userId,
      async (client) => {
        const { data, error } = await client
          .from('nextdns_sync_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Database query error for sync log:', error)
          throw error
        }
        
        console.log('NextDNS sync log found:', data?.length || 0)
        return data || []
      },
      'getNextDNSSyncLog'
    )
  } catch (error) {
    console.error('Error in getNextDNSSyncLog:', error)
    // Don't throw here - return empty array as fallback
    return []
  }
}

// Helper function to check if NextDNS is configured
export async function isNextDNSConfigured(userId: string): Promise<boolean> {
  try {
    const account = await getNextDNSAccount(userId)
    return account !== null && account.is_active
  } catch {
    return false
  }
}

// Import blocked websites function (needed for sync)
async function getBlockedWebsites(userId: string) {
  try {
    console.log('Getting blocked websites for user:', userId)
    
    return await executeWithContext(
      userId,
      async (client) => {
        const { data, error } = await client
          .from('blocked_websites')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Database query error for blocked websites:', error)
          throw error
        }
        
        console.log('Blocked websites found:', data?.length || 0)
        return data || []
      },
      'getBlockedWebsites'
    )
  } catch (error) {
    console.error('Error in getBlockedWebsites:', error)
    // Don't throw here - return empty array as fallback
    return []
  }
}