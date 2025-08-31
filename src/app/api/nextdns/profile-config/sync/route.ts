import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncProfileConfig } from '@/lib/nextdns-database'

// POST /api/nextdns/profile-config/sync - Force sync profile configuration
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('API: Force syncing profile config for user:', userId)
    
    const config = await syncProfileConfig(userId)
    
    if (!config) {
      return NextResponse.json({ 
        error: 'Unable to sync profile configuration. Please ensure you have a NextDNS account connected.' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      config,
      message: 'Profile configuration synced successfully'
    })
  } catch (error) {
    console.error('API: Error syncing profile config:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync profile configuration' },
      { status: 500 }
    )
  }
}