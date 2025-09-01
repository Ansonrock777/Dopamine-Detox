import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getBlockedWebsites, 
  addBlockedWebsite, 
  removeBlockedWebsite,
  toggleBlockedWebsiteAlwaysOn 
} from '@/lib/database'
import { syncWithNextDNS } from '@/lib/nextdns-database'

// GET /api/websites/blocked - Get user's blocked websites
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blockedSites = await getBlockedWebsites(userId)
    
    return NextResponse.json({ websites: blockedSites })
  } catch (error) {
    console.error('Error getting blocked websites:', error)
    return NextResponse.json(
      { error: 'Failed to get blocked websites' },
      { status: 500 }
    )
  }
}

// POST /api/websites/blocked - Add a website to the blocklist
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, isAlwaysOn = true } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate and clean URL
    const cleanUrl = url.trim().toLowerCase()
    
    // Basic URL validation
    if (!cleanUrl.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please enter a domain like "example.com"' },
        { status: 400 }
      )
    }

    // Add the website
    const website = await addBlockedWebsite(userId, cleanUrl, isAlwaysOn)

    // Sync with NextDNS if configured - use individual domain sync for better performance
    try {
      console.log(`🔄 Syncing website "${cleanUrl}" to NextDNS...`)
      
      // Check for business profile and sync individual domain
      const { getBusinessProfileForUser } = await import('@/lib/nextdns-business')
      const businessProfile = await getBusinessProfileForUser(userId)
      
      if (businessProfile) {
        const { NextDNSClient } = await import('@/lib/nextdns')
        const businessApiKey = process.env.NEXTDNS_BUSINESS_API_KEY
        
        if (businessApiKey) {
          const client = new NextDNSClient(businessApiKey)
          const realProfileId = '81fdf8' // Real endpoint for your business profile
          
          console.log(`🔄 Adding domain "${cleanUrl}" to NextDNS denylist`)
          await client.addToDenylist(realProfileId, cleanUrl)
          console.log(`✅ Domain "${cleanUrl}" added to NextDNS successfully`)
        } else {
          console.warn('⚠️ NEXTDNS_BUSINESS_API_KEY not configured, falling back to full sync')
          await syncWithNextDNS(userId)
        }
      } else {
        // Manual account - use full sync
        console.log('📡 Manual account detected, using full sync')
        await syncWithNextDNS(userId)
      }
      
      console.log('✅ NextDNS website sync completed successfully')
    } catch (syncError) {
      console.warn('❌ NextDNS sync failed:', syncError)
      console.warn('❌ NextDNS sync error details:', {
        message: syncError instanceof Error ? syncError.message : 'Unknown error',
        url: cleanUrl
      })
      // Don't fail the entire operation if sync fails
      // The website is still added to the database and can be synced later
    }

    return NextResponse.json({ website })
  } catch (error) {
    console.error('Error adding blocked website:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add website' },
      { status: 500 }
    )
  }
}

// DELETE /api/websites/blocked - Remove a website from the blocklist
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      )
    }

    // Get website info before deletion for NextDNS sync
    let websiteUrl = null
    try {
      const { getBlockedWebsites } = await import('@/lib/database')
      const websites = await getBlockedWebsites(userId)
      const website = websites.find(w => w.id === id)
      websiteUrl = website?.url
    } catch (getError) {
      console.warn('Could not get website for removal sync:', getError)
    }

    await removeBlockedWebsite(id, userId)

    // Sync with NextDNS if configured - remove individual domain
    try {
      if (websiteUrl) {
        console.log(`🔄 Removing website "${websiteUrl}" from NextDNS...`)
        
        // Check for business profile and remove individual domain
        const { getBusinessProfileForUser } = await import('@/lib/nextdns-business')
        const businessProfile = await getBusinessProfileForUser(userId)
        
        if (businessProfile) {
          const { NextDNSClient } = await import('@/lib/nextdns')
          const businessApiKey = process.env.NEXTDNS_BUSINESS_API_KEY
          
          if (businessApiKey) {
            const client = new NextDNSClient(businessApiKey)
            const realProfileId = '81fdf8' // Real endpoint for your business profile
            
            console.log(`🔄 Removing domain "${websiteUrl}" from NextDNS denylist`)
            await client.removeFromDenylist(realProfileId, websiteUrl)
            console.log(`✅ Domain "${websiteUrl}" removed from NextDNS successfully`)
          } else {
            console.warn('⚠️ NEXTDNS_BUSINESS_API_KEY not configured, falling back to full sync')
            await syncWithNextDNS(userId)
          }
        } else {
          // Manual account - use full sync
          console.log('📡 Manual account detected, using full sync')
          await syncWithNextDNS(userId)
        }
      } else {
        console.warn('⚠️ No URL found for removed website, using full sync as fallback')
        await syncWithNextDNS(userId)
      }
    } catch (syncError) {
      console.warn('❌ NextDNS remove sync failed:', syncError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing blocked website:', error)
    return NextResponse.json(
      { error: 'Failed to remove website' },
      { status: 500 }
    )
  }
}

// PATCH /api/websites/blocked - Toggle website on/off
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, isAlwaysOn } = await request.json()

    if (!id || typeof isAlwaysOn !== 'boolean') {
      return NextResponse.json(
        { error: 'Website ID and isAlwaysOn status are required' },
        { status: 400 }
      )
    }

    await toggleBlockedWebsiteAlwaysOn(id, userId, isAlwaysOn)

    // Sync with NextDNS if configured
    try {
      await syncWithNextDNS(userId)
    } catch (syncError) {
      console.warn('NextDNS sync failed:', syncError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling blocked website:', error)
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    )
  }
}
