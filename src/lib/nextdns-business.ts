/**
 * NextDNS Business Profile Manager
 * 
 * Handles automatic creation and management of NextDNS profiles
 * using the business account master API key.
 */

import { NextDNSClient } from './nextdns'
import { supabase, supabaseAdmin } from './supabase'

export interface BusinessProfile {
  id: string
  user_id: string
  nextdns_profile_id: string
  profile_name: string
  dns_server_1: string
  dns_server_2: string
  dns_ipv6_1?: string | null
  dns_ipv6_2?: string | null
  status: 'active' | 'suspended' | 'deleted'
  created_at: string
  updated_at: string
}

export interface DNSConfiguration {
  primary: string
  secondary: string
  ipv6Primary?: string
  ipv6Secondary?: string
  setupInstructions: {
    ios: string
    android: string
    windows: string
    macos: string
    linux: string
  }
}

export class NextDNSBusinessManager {
  private masterApiKey: string
  private client: NextDNSClient

  constructor() {
    this.masterApiKey = process.env.NEXTDNS_BUSINESS_API_KEY || ''
    
    if (!this.masterApiKey) {
      throw new Error('NEXTDNS_BUSINESS_API_KEY environment variable is required for business profile creation')
    }
    
    if (this.masterApiKey.length < 20) {
      throw new Error('NEXTDNS_BUSINESS_API_KEY appears to be invalid (too short)')
    }
    
    this.client = new NextDNSClient(this.masterApiKey)
  }

  /**
   * Create a new NextDNS profile for a user using the business account
   */
  async createUserProfile(
    userId: string,
    userName?: string,
    profileName?: string
  ): Promise<BusinessProfile> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('Invalid userId: userId must be a non-empty string')
      }
      
      console.log(`🔄 Creating NextDNS business profile for user: ${userId}`)

      // Check if user already has a business profile
      const existingProfile = await this.getBusinessProfile(userId)
      if (existingProfile) {
        console.log(`✅ User already has business profile: ${existingProfile.nextdns_profile_id}`)
        return existingProfile
      }

      // Fetch user information from profiles table for better naming
      let userFullName = userName || 'User'
      try {
        console.log(`🔄 Fetching user profile information for: ${userId}`)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, username')
          .eq('id', userId)
          .single()

        if (!error && profileData) {
          if (profileData.first_name || profileData.last_name) {
            userFullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          } else if (profileData.username) {
            userFullName = profileData.username
          }
          console.log(`✅ Retrieved user profile: ${userFullName}`)
        }
      } catch (profileError) {
        console.warn(`⚠️ Could not fetch user profile, using fallback name:`, profileError)
      }

      // Generate unique profile name with timestamp and user ID to ensure no duplicates
      // Keep name reasonably short for NextDNS limits (typically 50-100 chars)
      const timestamp = new Date().toISOString().slice(0, 10) // Just the date: 2024-01-01
      const userIdShort = userId.length >= 8 ? userId.substring(0, 8) : userId.padEnd(8, '0') // Ensure 8 characters
      const randomSuffix = Math.random().toString(36).substring(2, 6) // 4-character random string
      
      // Sanitize and truncate user name if too long to keep total length reasonable
      const maxUserNameLength = 20
      const sanitizedUserName = (userFullName || 'User')
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .trim()
      const truncatedUserName = sanitizedUserName.length > maxUserNameLength 
        ? sanitizedUserName.substring(0, maxUserNameLength).trim() 
        : sanitizedUserName
      
      // Ensure we have a valid name
      const safeTruncatedUserName = truncatedUserName || 'User'
      
      const baseProfileName = profileName || `${safeTruncatedUserName}-${timestamp}-${userIdShort}-${randomSuffix}`
      
      // Create NextDNS profile using business API
      console.log(`🔄 Creating NextDNS profile with base name: ${baseProfileName}`)
      console.log(`🔍 Using API key: ${this.masterApiKey ? this.masterApiKey.substring(0, 8) + '...' : 'NOT SET'}`)
      
      let nextdnsProfile
      let profileCreationAttempts = 0
      const maxAttempts = 3
      let finalProfileName = baseProfileName // Track the final successful profile name
      
      while (profileCreationAttempts < maxAttempts) {
        try {
          // Generate unique name for each attempt
          const attemptedProfileName = profileCreationAttempts === 0 
            ? baseProfileName 
            : `${baseProfileName}-r${profileCreationAttempts}${Math.random().toString(36).substring(2, 4)}`
          
          finalProfileName = attemptedProfileName // Update the final name for this attempt
            
          console.log(`🔄 Making NextDNS API call (attempt ${profileCreationAttempts + 1}/${maxAttempts}) with name: ${attemptedProfileName}`)
          console.log(`🔄 Using API key: ${this.masterApiKey.substring(0, 8)}...`)
          
          nextdnsProfile = await this.client.createProfile(attemptedProfileName)
          console.log(`🔍 NextDNS profile response:`, JSON.stringify(nextdnsProfile, null, 2))
          console.log(`🔍 NextDNS profile ID extracted:`, nextdnsProfile?.id)
          break // Success, exit retry loop
        } catch (apiError) {
          profileCreationAttempts++
          
          // Check if this is a duplicate error and we can retry
          if (apiError instanceof Error && 
              apiError.message.includes('already exists') && 
              profileCreationAttempts < maxAttempts) {
            console.warn(`⚠️ Profile name conflict (attempt ${profileCreationAttempts}), retrying with different name...`)
            continue // Try again with different name
          }
          
          // If it's not a duplicate error or we've exhausted retries, handle the error
          console.error('❌ NextDNS API call failed:', apiError)
          console.error('❌ API Error details:', {
            message: apiError instanceof Error ? apiError.message : 'Unknown error',
            stack: apiError instanceof Error ? apiError.stack : 'No stack trace',
            apiKey: this.masterApiKey ? `${this.masterApiKey.substring(0, 8)}...` : 'NOT SET',
            environment: process.env.NODE_ENV
          })
          
          // Always create a mock profile for development to allow testing UI
          if (process.env.NODE_ENV === 'development') {
            console.warn('🚧 Development mode: Creating mock NextDNS profile for testing')
            nextdnsProfile = {
              id: `dev-profile-${Date.now()}`,
              name: finalProfileName,
              parentalControl: {
                safeSearch: false,
                youtubeRestrictedMode: false,
                blockBypass: false,
                services: [],
                categories: []
              },
              denylist: [],
              allowlist: []
            }
            break // Exit retry loop with mock profile
          } else {
            // In production, provide more detailed error information
            let errorMessage = 'NextDNS API failed'
            if (apiError instanceof Error) {
              if (apiError.message.includes('401') || apiError.message.includes('403')) {
                errorMessage = 'NextDNS API authentication failed. Please check your NEXTDNS_BUSINESS_API_KEY'
              } else if (apiError.message.includes('404')) {
                errorMessage = 'NextDNS API endpoint not found. The API may have changed'
              } else if (apiError.message.includes('500')) {
                errorMessage = 'NextDNS server error. Please try again later'
              } else if (apiError.message.includes('already exists')) {
                errorMessage = `NextDNS profile name conflicts persisted after ${maxAttempts} attempts. Please try again later.`
              } else {
                errorMessage = `NextDNS API error: ${apiError.message}`
              }
            }
            throw new Error(errorMessage)
          }
        }
      }
      
      if (!nextdnsProfile) {
        console.error('❌ NextDNS profile is null/undefined')
        throw new Error('NextDNS profile creation failed: API returned null/undefined response')
      }
      
      if (!nextdnsProfile.id) {
        console.error('❌ NextDNS profile missing ID. Full response:', JSON.stringify(nextdnsProfile, null, 2))
        throw new Error('NextDNS profile creation failed: missing profile id in API response')
      }
      console.log(`✅ NextDNS profile created: ${nextdnsProfile.id}`)

      // Apply default blocking policies (skip in dev mode with mock profiles)
      if (!nextdnsProfile.id.startsWith('dev-profile-')) {
        await this.applyDefaultPolicies(nextdnsProfile.id)
      } else {
        console.warn('🚧 Skipping NextDNS policy application for development profile')
      }

      // Generate DNS server configuration
      const dnsConfig = this.generateDNSConfiguration(nextdnsProfile.id)

      // Use admin client to bypass RLS for business profile creation
      console.log(`🔄 Creating business profile using admin client: ${userId}`)
      console.log(`🔍 Admin client available:`, !!supabaseAdmin)
      console.log(`🔍 Service role key set:`, !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      
      if (!supabaseAdmin) {
        console.error('❌ Admin client is null - SUPABASE_SERVICE_ROLE_KEY may be missing')
        throw new Error('Admin client not available - check SUPABASE_SERVICE_ROLE_KEY environment variable')
      }

      // Set user context even with admin client (some RLS policies may still check this)
      console.log(`🔄 Setting user context with admin client: ${userId}`)
      await supabaseAdmin.rpc('set_current_user_id', { user_id: userId })

      // Store in business profiles table
      // Try with IPv6 columns first, fallback to IPv4 only if columns don't exist
      let businessProfile, error
      
      try {
        const insertData = {
          user_id: userId,
          nextdns_profile_id: nextdnsProfile.id,
          profile_name: finalProfileName,
          dns_server_1: dnsConfig.primary,
          dns_server_2: dnsConfig.secondary,
          dns_ipv6_1: dnsConfig.ipv6Primary,
          dns_ipv6_2: dnsConfig.ipv6Secondary,
          dns_over_https_url: dnsConfig.dnsOverHttpsUrl,
          status: 'active'
        }
        
        console.log(`🔄 Attempting to insert business profile with data:`, insertData)
        const result = await supabaseAdmin
          .from('nextdns_business_profiles')
          .insert(insertData)
          .select()
          .single()
          
        businessProfile = result.data
        error = result.error
        console.log(`🔍 Insert result - error:`, error, `data:`, !!businessProfile)
      } catch (ipv6Error: unknown) {
        // Check if the main insert failed due to a duplicate key error
        if (ipv6Error instanceof Error && ipv6Error.message.includes('duplicate key') && ipv6Error.message.includes('nextdns_business_profiles_user_id_key')) {
          console.warn('⚠️ Duplicate key error in main insert - profile already exists, attempting to retrieve it')
          
          try {
            const existingProfile = await this.getBusinessProfile(userId)
            if (existingProfile) {
              console.log('✅ Successfully retrieved existing business profile after main insert duplicate key error')
              return existingProfile
            }
          } catch (retrieveError) {
            console.error('❌ Failed to retrieve existing profile after main insert duplicate key error:', retrieveError)
          }
        }
        
        // If IPv6 columns don't exist, try without them
        console.warn('IPv6 columns not found or other error, inserting without IPv6 data:', ipv6Error instanceof Error ? ipv6Error.message : ipv6Error)
        
        const fallbackData = {
          user_id: userId,
          nextdns_profile_id: nextdnsProfile.id,
          profile_name: finalProfileName,
          dns_server_1: dnsConfig.primary,
          dns_server_2: dnsConfig.secondary,
          dns_over_https_url: dnsConfig.dnsOverHttpsUrl,
          status: 'active'
        }
        
        console.log(`🔄 Attempting fallback insert with data:`, fallbackData)
        const result = await supabaseAdmin
          .from('nextdns_business_profiles')
          .insert(fallbackData)
          .select()
          .single()
          
        businessProfile = result.data
        error = result.error
        console.log(`🔍 Fallback insert result - error:`, error, `data:`, !!businessProfile)
      }

      if (error) {
        console.error('❌ Failed to store business profile with admin client:', error)
        console.error('❌ Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details 
        })

        // Check if this is a duplicate key error
        if (error.message && error.message.includes('duplicate key') && error.message.includes('nextdns_business_profiles_user_id_key')) {
          console.warn('⚠️ Duplicate key error detected - profile already exists, attempting to retrieve it')
          
          // Try to get the existing profile using admin client
          try {
            const existingProfile = await this.getBusinessProfile(userId)
            if (existingProfile) {
              console.log('✅ Successfully retrieved existing business profile after duplicate key error')
              return existingProfile
            }
          } catch (retrieveError) {
            console.error('❌ Failed to retrieve existing profile after duplicate key error:', retrieveError)
          }
        }
        
        console.log('🔄 Attempting fallback with RLS-bypass function...')
        
        // Ultimate fallback: Use database function with SECURITY DEFINER to bypass RLS completely
        try {
          const { data: functionData, error: functionError } = await supabaseAdmin.rpc(
            'create_business_profile_bypass_rls',
            {
              p_user_id: userId,
              p_nextdns_profile_id: nextdnsProfile.id,
              p_profile_name: finalProfileName,
              p_dns_server_1: dnsConfig.primary,
              p_dns_server_2: dnsConfig.secondary,
              p_dns_ipv6_1: dnsConfig.ipv6Primary,
              p_dns_ipv6_2: dnsConfig.ipv6Secondary,
              p_dns_over_https_url: dnsConfig.dnsOverHttpsUrl
            }
          )
          
          if (functionError) {
            console.error('❌ RLS-bypass function also failed:', functionError)
            console.error('❌ Function error details:', { 
              code: functionError.code, 
              message: functionError.message, 
              details: functionError.details 
            })

            // Check for duplicate key error in function call too
            if (functionError.message && functionError.message.includes('duplicate key') && functionError.message.includes('nextdns_business_profiles_user_id_key')) {
              console.warn('⚠️ Duplicate key error in RLS-bypass function - attempting final profile retrieval')
              
              try {
                const existingProfile = await this.getBusinessProfile(userId)
                if (existingProfile) {
                  console.log('✅ Successfully retrieved existing profile after RLS-bypass duplicate key error')
                  return existingProfile
                }
              } catch (finalRetrieveError) {
                console.error('❌ Final profile retrieval failed:', finalRetrieveError)
              }
            }
            
            throw new Error(`Failed to store business profile: ${functionError.message}`)
          }
          
          businessProfile = functionData
          console.log('✅ RLS-bypass function successful')
        } catch (functionFallbackError) {
          console.error('❌ All insert methods failed:', functionFallbackError)
          
          // Last resort: if it's a duplicate key error, try one final profile retrieval
          if (functionFallbackError instanceof Error && functionFallbackError.message.includes('duplicate key')) {
            console.warn('⚠️ Last resort: attempting final profile retrieval after all insertion methods failed')
            
            try {
              const existingProfile = await this.getBusinessProfile(userId)
              if (existingProfile) {
                console.log('✅ Last resort profile retrieval successful')
                return existingProfile
              }
            } catch (lastResortError) {
              console.error('❌ Last resort profile retrieval failed:', lastResortError)
            }
          }
          
          throw new Error(`Failed to store business profile: ${error.message}`)
        }
      }

      console.log(`✅ Business profile stored in database: ${businessProfile.id}`)

      // Initialize user categories for this profile (skip API calls in dev mode)
      if (!nextdnsProfile.id.startsWith('dev-profile-')) {
        await this.initializeUserCategories(userId)
      } else {
        console.warn('🚧 Skipping NextDNS category initialization for development profile')
        // Still create local database entries for development
        await this.initializeUserCategoriesDev(userId)
      }

      return businessProfile
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      
      // Check if this is a duplicate key error - final safety net
      if (error instanceof Error && error.message.includes('duplicate key') && error.message.includes('nextdns_business_profiles_user_id_key')) {
        console.warn('⚠️ Final catch: duplicate key error detected - attempting to retrieve existing profile')
        
        try {
          const existingProfile = await this.getBusinessProfile(userId)
          if (existingProfile) {
            console.log('✅ Final catch: successfully retrieved existing business profile')
            return existingProfile
          } else {
            console.error('❌ Final catch: could not retrieve existing profile despite duplicate key error')
          }
        } catch (retrieveError) {
          console.error('❌ Final catch: failed to retrieve existing profile:', retrieveError)
        }
      }
      
      throw error
    }
  }

  /**
   * Get existing business profile for user
   */
  async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    console.log(`🔄 Checking for existing business profile for user: ${userId}`)
    
    try {
      // Use admin client for more reliable detection (bypasses RLS)
      if (supabaseAdmin) {
        console.log(`🔄 Using admin client to check for existing profile`)
        await supabaseAdmin.rpc('set_current_user_id', { user_id: userId })

        const { data, error } = await supabaseAdmin
          .from('nextdns_business_profiles')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') { // Not found error is OK
          console.error('Admin client error fetching active business profile:', error)
          
          // Try to find ANY profile for this user (regardless of status) as fallback
          console.log(`🔄 Attempting to find profile with any status as fallback`)
          try {
            const { data: anyStatusData, error: anyStatusError } = await supabaseAdmin
              .from('nextdns_business_profiles')
              .select('*')
              .eq('user_id', userId)
              .single()
              
            if (anyStatusData && !anyStatusError) {
              console.log(`✅ Found existing business profile with any status: ${anyStatusData.nextdns_profile_id} (status: ${anyStatusData.status})`)
              // Reactivate the profile if needed
              if (anyStatusData.status !== 'active') {
                console.log(`🔄 Reactivating profile with status: ${anyStatusData.status}`)
                const { data: updatedData } = await supabaseAdmin
                  .from('nextdns_business_profiles')
                  .update({ status: 'active', updated_at: new Date().toISOString() })
                  .eq('id', anyStatusData.id)
                  .select()
                  .single()
                  
                return updatedData || anyStatusData
              }
              return anyStatusData
            }
          } catch (anyStatusFallbackError) {
            console.error('❌ Failed to find profile with any status:', anyStatusFallbackError)
          }
          // Fall back to regular client if admin fails
        } else {
          if (data) {
            console.log(`✅ Found existing business profile with admin client: ${data.nextdns_profile_id}`)
          } else {
            console.log(`ℹ️ No existing business profile found with admin client`)
          }
          return data
        }
      }

      // Fallback to regular client with RLS
      console.log(`🔄 Falling back to regular client with RLS`)
      await supabase.rpc('set_current_user_id', { user_id: userId })

      const { data, error } = await supabase
        .from('nextdns_business_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error('Regular client error fetching business profile:', error)
        // Don't throw here, return null to allow creation attempt
        console.warn('⚠️ Profile detection failed, will attempt creation')
        return null
      }

      if (data) {
        console.log(`✅ Found existing business profile with regular client: ${data.nextdns_profile_id}`)
      } else {
        console.log(`ℹ️ No existing business profile found with regular client`)
      }
      return data

    } catch (error) {
      console.error('❌ Unexpected error in getBusinessProfile:', error)
      // Return null to allow creation attempt rather than throwing
      return null
    }
  }

  /**
   * Delete/suspend business profile
   */
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      console.log(`🔄 Deleting business profile for user: ${userId}`)

      const profile = await this.getBusinessProfile(userId)
      if (!profile) {
        console.log(`ℹ️ No business profile found for user: ${userId}`)
        return
      }

      // Mark as deleted in database (soft delete)
      const { error } = await supabase
        .from('nextdns_business_profiles')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (error) {
        throw new Error(`Failed to delete business profile: ${error.message}`)
      }

      // Note: We keep the NextDNS profile active for now
      // In production, you might want to delete it or transfer ownership
      console.log(`✅ Business profile marked as deleted: ${profile.id}`)
    } catch (error) {
      console.error('❌ Error deleting user profile:', error)
      throw error
    }
  }

  /**
   * Apply default blocking policies to a new profile
   */
  private async applyDefaultPolicies(profileId: string): Promise<void> {
    try {
      console.log(`🔄 Applying default policies to profile: ${profileId}`)

      // Default categories to block for new users
      const defaultBlockedCategories = [
        'porn',           // Adult content
        'gambling',       // Gambling sites
        'social-networks' // Social media
      ]

      // Apply category blocks
      for (const categoryId of defaultBlockedCategories) {
        try {
          await this.client.blockCategory(profileId, categoryId)
          console.log(`✅ Blocked category: ${categoryId}`)
        } catch (error) {
          console.warn(`⚠️ Failed to block category ${categoryId}:`, error)
          // Continue with other categories
        }
      }

      // Default domains to block
      const defaultBlockedDomains = [
        'facebook.com',
        'instagram.com',
        'twitter.com',
        'tiktok.com',
        'youtube.com'
      ]

      // Apply domain blocks
      for (const domain of defaultBlockedDomains) {
        try {
          await this.client.addToDenylist(profileId, domain)
          console.log(`✅ Blocked domain: ${domain}`)
        } catch (error) {
          console.warn(`⚠️ Failed to block domain ${domain}:`, error)
          // Continue with other domains
        }
      }

      console.log(`✅ Default policies applied to profile: ${profileId}`)
    } catch (error) {
      console.error('❌ Error applying default policies:', error)
      throw error
    }
  }

  /**
   * Generate DNS configuration for a profile
   */
  private generateDNSConfiguration(profileId: string): {
    primary: string
    secondary: string
    ipv6Primary: string
    ipv6Secondary: string
    dnsOverHttpsUrl: string
  } {
    // NextDNS DNS server format
    const dnsId = profileId
    
    return {
      primary: `${dnsId}.dns.nextdns.io`,
      secondary: `${dnsId}.dns2.nextdns.io`, 
      ipv6Primary: `2a07:a8c0::${dnsId}`,
      ipv6Secondary: `2a07:a8c1::${dnsId}`,
      dnsOverHttpsUrl: `https://dns.nextdns.io/${dnsId}`
    }
  }

  /**
   * Initialize NextDNS categories for user in database
   */
  private async initializeUserCategories(userId: string): Promise<void> {
    try {
      console.log(`🔄 Initializing categories for user: ${userId}`)

      if (!supabaseAdmin) {
        throw new Error('Admin client not available for category initialization')
      }

      // Set user context for RLS (even with admin client)
      await supabaseAdmin.rpc('set_current_user_id', { user_id: userId })

      // Get available categories
      const availableCategories = await this.client.getAvailableCategories()

      // Insert categories into nextdns_categories table
      const categoryInserts = availableCategories.map(category => ({
        user_id: userId,
        category_id: category.id,
        category_name: category.name,
        is_blocked: ['porn', 'gambling', 'social-networks'].includes(category.id) // Default blocked
      }))

      console.log(`🔄 Inserting ${categoryInserts.length} categories for user`)
      const { error } = await supabaseAdmin
        .from('nextdns_categories')
        .upsert(categoryInserts, { 
          onConflict: 'user_id,category_id',
          ignoreDuplicates: true 
        })

      if (error) {
        console.error('Error initializing categories:', error)
        throw new Error(`Failed to initialize categories: ${error.message}`)
      }

      console.log(`✅ Initialized ${availableCategories.length} categories for user`)
    } catch (error) {
      console.error('❌ Error initializing categories:', error)
      throw error
    }
  }

  /**
   * Initialize NextDNS categories for development mode (without API calls)
   */
  private async initializeUserCategoriesDev(userId: string): Promise<void> {
    try {
      console.log(`🔄 Initializing dev categories for user: ${userId}`)

      if (!supabaseAdmin) {
        throw new Error('Admin client not available for category initialization')
      }

      // Mock categories for development
      const devCategories = [
        { id: 'porn', name: 'Porn' },
        { id: 'gambling', name: 'Gambling' },
        { id: 'social-networks', name: 'Social Networks' },
        { id: 'gaming', name: 'Online Gaming' },
        { id: 'video-streaming', name: 'Video Streaming' },
        { id: 'dating', name: 'Dating' },
        { id: 'piracy', name: 'Piracy' }
      ]

      // Insert categories into nextdns_categories table
      const categoryInserts = devCategories.map(category => ({
        user_id: userId,
        category_id: category.id,
        category_name: category.name,
        is_blocked: ['porn', 'gambling', 'social-networks'].includes(category.id) // Default blocked
      }))

      console.log(`🔄 Inserting ${categoryInserts.length} dev categories for user`)
      const { error } = await supabaseAdmin
        .from('nextdns_categories')
        .upsert(categoryInserts, { 
          onConflict: 'user_id,category_id',
          ignoreDuplicates: true 
        })

      if (error) {
        console.error('Error initializing dev categories:', error)
        throw new Error(`Failed to initialize dev categories: ${error.message}`)
      }

      console.log(`✅ Initialized ${devCategories.length} dev categories for user`)
    } catch (error) {
      console.error('❌ Error initializing dev categories:', error)
      throw error
    }
  }

  /**
   * Get DNS setup instructions for user
   */
  getDNSSetupInstructions(profile: BusinessProfile): DNSConfiguration {
    const dns = {
      primary: profile.dns_server_1,
      secondary: profile.dns_server_2,
      ipv6Primary: profile.dns_ipv6_1 || undefined,
      ipv6Secondary: profile.dns_ipv6_2 || undefined
    }

    return {
      ...dns,
      setupInstructions: {
        ios: `Settings → WiFi → Select Network → Configure DNS → Manual → Add Servers: ${dns.primary}, ${dns.secondary}`,
        android: `Settings → Network & Internet → Private DNS → Private DNS Provider → ${dns.primary}`,
        windows: `Settings → Network & Internet → Ethernet/WiFi → Properties → DNS Settings → Manual → IPv4: ${dns.primary}, ${dns.secondary}`,
        macos: `System Preferences → Network → Advanced → DNS → Add: ${dns.primary}, ${dns.secondary}`,
        linux: `Edit /etc/systemd/resolved.conf → DNS=${dns.primary} ${dns.secondary} → Restart systemd-resolved`
      }
    }
  }

  /**
   * Sync user's blocking preferences to their business profile
   */
  async syncUserPreferences(userId: string): Promise<void> {
    try {
      console.log(`🔄 Syncing preferences for user: ${userId}`)

      // Set user context for RLS
      await supabase.rpc('set_current_user_id', { user_id: userId })

      const profile = await this.getBusinessProfile(userId)
      if (!profile) {
        throw new Error('User does not have a business profile')
      }

      // Get user's blocked websites
      const { data: blockedWebsites, error: websitesError } = await supabase
        .from('blocked_websites')
        .select('url')
        .eq('user_id', userId)
        .eq('is_always_on', true)

      if (websitesError) {
        throw new Error(`Failed to fetch blocked websites: ${websitesError.message}`)
      }

      // Get user's blocked categories
      const { data: blockedCategories, error: categoriesError } = await supabase
        .from('nextdns_categories')
        .select('category_id')
        .eq('user_id', userId)
        .eq('is_blocked', true)

      if (categoriesError) {
        throw new Error(`Failed to fetch blocked categories: ${categoriesError.message}`)
      }

      // Extract arrays
      const domains = blockedWebsites?.map(w => w.url) || []
      const categories = blockedCategories?.map(c => c.category_id) || []

      // Sync to NextDNS
      await this.client.syncUserBlocking(profile.nextdns_profile_id, domains, categories, [])

      console.log(`✅ Synced preferences for user: ${userId}`)
    } catch (error) {
      console.error('❌ Error syncing preferences:', error)
      throw error
    }
  }

  /**
   * Get profile analytics (if available)
   */
  async getProfileAnalytics(userId: string, from?: Date, to?: Date): Promise<unknown> {
    const profile = await this.getBusinessProfile(userId)
    if (!profile) {
      throw new Error('User does not have a business profile')
    }

    return await this.client.getAnalytics(profile.nextdns_profile_id, from, to)
  }
}

// Utility functions
export async function createBusinessProfileForUser(
  userId: string,
  userName?: string,
  profileName?: string
): Promise<BusinessProfile> {
  const manager = new NextDNSBusinessManager()
  return await manager.createUserProfile(userId, userName, profileName)
}

export async function getBusinessProfileForUser(userId: string): Promise<BusinessProfile | null> {
  const manager = new NextDNSBusinessManager()
  return await manager.getBusinessProfile(userId)
}

export async function syncBusinessProfilePreferences(userId: string): Promise<void> {
  const manager = new NextDNSBusinessManager()
  await manager.syncUserPreferences(userId)
}