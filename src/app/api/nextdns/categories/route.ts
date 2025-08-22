import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getNextDNSCategories, updateNextDNSCategory, isNextDNSConfigured } from '@/lib/nextdns-database'

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

    // Auto-sync with NextDNS if configured - individual category sync
    try {
      const isConfigured = await isNextDNSConfigured(userId)
      if (isConfigured) {
        console.log(`Syncing individual category "${categoryId}" (${isBlocked ? 'blocked' : 'unblocked'}) to NextDNS...`)
        
        // Get NextDNS account for direct API calls
        const { getNextDNSAccount } = await import('@/lib/nextdns-database')
        const { NextDNSClient } = await import('@/lib/nextdns')
        
        const account = await getNextDNSAccount(userId)
        if (account) {
          const client = new NextDNSClient(account.api_key)
          
          if (isBlocked) {
            await client.blockCategory(account.profile_id, categoryId)
            console.log(`✅ Category ${categoryId} blocked in NextDNS`)
          } else {
            await client.unblockCategory(account.profile_id, categoryId)
            console.log(`✅ Category ${categoryId} unblocked in NextDNS`)
          }
        }
        
        console.log('NextDNS individual category sync completed')
      } else {
        console.log('NextDNS not configured, skipping auto-sync')
      }
    } catch (syncError) {
      console.error('Auto-sync failed after category update:', syncError)
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