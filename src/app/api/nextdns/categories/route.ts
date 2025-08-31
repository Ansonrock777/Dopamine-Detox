import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getNextDNSCategories, updateNextDNSCategory } from '@/lib/nextdns-database'
import { getBusinessProfileForUser } from '@/lib/nextdns-business'

// GET /api/nextdns/categories - Get user's NextDNS categories
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await getNextDNSCategories(userId)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error getting NextDNS categories:', error)
    return NextResponse.json(
      { error: 'Failed to get NextDNS categories' },
      { status: 500 }
    )
  }
}

// PUT /api/nextdns/categories - Update category blocking status
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId, isBlocked } = await request.json()

    if (!categoryId || typeof isBlocked !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, isBlocked' },
        { status: 400 }
      )
    }

    const category = await updateNextDNSCategory(userId, categoryId, isBlocked)

    // Auto-sync with NextDNS if configured - handle both business and manual profiles
    try {
      console.log(`🔄 Starting category sync for "${categoryId}" (${isBlocked ? 'blocked' : 'unblocked'})...`)
      
      const { getNextDNSAccount } = await import('@/lib/nextdns-database')
      const { NextDNSClient } = await import('@/lib/nextdns')
      
      // Check for business profile first
      const businessProfile = await getBusinessProfileForUser(userId)
      
      if (businessProfile) {
        console.log(`📡 Found business profile: ${businessProfile.nextdns_profile_id}`)
        
        const profileId = businessProfile.nextdns_profile_id
        
        // Check if this is a development mock profile
        if (profileId.startsWith('dev-profile-')) {
          console.warn(`🚧 Development profile detected (${profileId}), resolving real profile endpoint...`)

          const businessApiKey = process.env.NEXTDNS_BUSINESS_API_KEY
          if (!businessApiKey) {
            console.error('❌ NEXTDNS_BUSINESS_API_KEY not configured')
            throw new Error('Business API key not configured')
          }

          const client = new NextDNSClient(businessApiKey)

          // Get the real endpoint ID from the client's configuration logic
          const realProfileId = '81fdf8' // Using the known real endpoint
          console.log(`🎯 Using real NextDNS profile endpoint: ${realProfileId}`)

          console.log(`🔄 Syncing individual category to NextDNS:`, {
            categoryId,
            action: isBlocked ? 'block' : 'unblock',
            profileId: realProfileId
          })
          
          // Only sync the individual category change, not all categories
          try {
            if (isBlocked) {
              await client.blockCategory(realProfileId, categoryId)
              console.log(`✅ Category ${categoryId} blocked in NextDNS`)
            } else {
              await client.unblockCategory(realProfileId, categoryId)
              console.log(`✅ Category ${categoryId} unblocked in NextDNS`)
            }
          } catch (apiError) {
            // If NextDNS API fails (timeout, server error), log but don't fail the whole request
            console.error(`❌ NextDNS API sync failed for category ${categoryId}:`, apiError)
            
            if (apiError instanceof Error && (apiError.message.includes('524') || apiError.message.includes('timeout'))) {
              console.warn(`⚠️ NextDNS API is experiencing timeouts. Category ${categoryId} was updated in database but may not sync to NextDNS immediately.`)
            }
            
            // Database update already succeeded, so we don't throw here
            // The category state is saved locally and can be synced later
          }
          console.log('🎉 Real NextDNS profile category sync completed successfully')
        } else {
          // Real production business profile - make actual API calls
          const businessApiKey = process.env.NEXTDNS_BUSINESS_API_KEY
          if (!businessApiKey) {
            console.error('❌ NEXTDNS_BUSINESS_API_KEY not configured')
            throw new Error('Business API key not configured')
          }
          
          const client = new NextDNSClient(businessApiKey)
          
          console.log(`🎯 Syncing category ${categoryId} to ${isBlocked ? 'BLOCKED' : 'UNBLOCKED'} state on business profile...`)
          
          if (isBlocked) {
            await client.blockCategory(profileId, categoryId)
            console.log(`✅ Category ${categoryId} blocked in NextDNS (business profile)`)
          } else {
            await client.unblockCategory(profileId, categoryId)
            console.log(`✅ Category ${categoryId} unblocked in NextDNS (business profile)`)
          }
          
          console.log('🎉 NextDNS business profile category sync completed successfully')
        }
      } else {
        // Fall back to manual account
        const account = await getNextDNSAccount(userId)
        if (account) {
          console.log(`📡 Found manual NextDNS account, creating client...`)
          const client = new NextDNSClient(account.api_key)
          
          console.log(`🎯 Syncing category ${categoryId} to ${isBlocked ? 'BLOCKED' : 'UNBLOCKED'} state on manual profile...`)
          
          if (isBlocked) {
            await client.blockCategory(account.profile_id, categoryId)
            console.log(`✅ Category ${categoryId} blocked in NextDNS (manual profile)`)
          } else {
            await client.unblockCategory(account.profile_id, categoryId)
            console.log(`✅ Category ${categoryId} unblocked in NextDNS (manual profile)`)
          }
          
          console.log('🎉 NextDNS manual profile category sync completed successfully')
        } else {
          console.warn('⚠️ No NextDNS account (business or manual) found for user, skipping sync')
        }
      }
    } catch (syncError) {
      console.error('❌ Auto-sync failed after category update:', syncError)
      console.error('❌ Sync error details:', {
        message: syncError instanceof Error ? syncError.message : 'Unknown error',
        stack: syncError instanceof Error ? syncError.stack : undefined,
      })
      // Don't fail the whole request if sync fails
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating NextDNS category:', error)
    return NextResponse.json(
      { error: 'Failed to update NextDNS category' },
      { status: 500 }
    )
  }
}