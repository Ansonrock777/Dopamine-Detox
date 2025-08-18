import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncWithNextDNS, getNextDNSSyncLog, isNextDNSConfigured } from '@/lib/nextdns-database'

// POST /api/nextdns/sync - Trigger sync with NextDNS
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if NextDNS is configured
    const isConfigured = await isNextDNSConfigured(userId)
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'NextDNS account not configured' },
        { status: 400 }
      )
    }

    // Trigger sync
    await syncWithNextDNS(userId)

    return NextResponse.json({ 
      success: true,
      message: 'Successfully synced with NextDNS'
    })
  } catch (error) {
    console.error('Error syncing with NextDNS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync with NextDNS' },
      { status: 500 }
    )
  }
}

// GET /api/nextdns/sync - Get sync log
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncLog = await getNextDNSSyncLog(userId)

    return NextResponse.json({ syncLog })
  } catch (error) {
    console.error('Error getting NextDNS sync log:', error)
    return NextResponse.json(
      { error: 'Failed to get NextDNS sync log' },
      { status: 500 }
    )
  }
}