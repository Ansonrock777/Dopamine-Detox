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

    // Sync with NextDNS if configured
    try {
      console.log('Attempting to sync with NextDNS after adding blocked website...')
      await syncWithNextDNS(userId)
      console.log('NextDNS sync completed successfully')
    } catch (syncError) {
      console.warn('NextDNS sync failed:', syncError)
      console.warn('NextDNS sync error details:', {
        message: syncError instanceof Error ? syncError.message : 'Unknown error',
        stack: syncError instanceof Error ? syncError.stack : undefined,
      })
      // Don't fail the entire operation if sync fails, but notify the user
      // Note: The website is still added to the database even if NextDNS sync fails
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

    await removeBlockedWebsite(id, userId)

    // Sync with NextDNS if configured
    try {
      await syncWithNextDNS(userId)
    } catch (syncError) {
      console.warn('NextDNS sync failed:', syncError)
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
