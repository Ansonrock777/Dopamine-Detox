import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileConfig, ensureProfileConfigSynced } from '@/lib/nextdns-database'

// GET /api/nextdns/profile-config - Get cached profile configuration
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('API: Getting profile config for user:', userId)
    
    // Get cached profile config (auto-syncs if needed)
    const config = await ensureProfileConfigSynced(userId)
    
    return NextResponse.json({ 
      config,
      message: config ? 'Profile configuration loaded' : 'No profile configuration found'
    })
  } catch (error) {
    console.error('API: Error getting profile config:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get profile configuration' },
      { status: 500 }
    )
  }
}