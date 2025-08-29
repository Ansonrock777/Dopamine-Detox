import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  NextDNSBusinessManager,
  createBusinessProfileForUser,
  getBusinessProfileForUser,
  syncBusinessProfilePreferences
} from '@/lib/nextdns-business'

export const runtime = 'nodejs' // Required for NextDNS Business API access

// GET /api/nextdns/business - Get user's business profile
export async function GET() {
  try {
    console.log('GET /api/nextdns/business - Starting request')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching business profile for user:', userId)
    const profile = await getBusinessProfileForUser(userId)
    
    if (!profile) {
      console.log('No business profile found')
      return NextResponse.json({ profile: null })
    }

    // Get DNS setup instructions
    const manager = new NextDNSBusinessManager()
    const dnsConfig = manager.getDNSSetupInstructions(profile)

    console.log('Returning business profile:', profile.id)
    return NextResponse.json({ 
      profile,
      dnsConfiguration: dnsConfig
    })
  } catch (error) {
    console.error('Error getting business profile:', error)
    return NextResponse.json(
      { error: 'Failed to get business profile' },
      { status: 500 }
    )
  }
}

// POST /api/nextdns/business - Create new business profile for user
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/nextdns/business - Creating business profile')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from Clerk if available
    const { profileName } = await request.json().catch(() => ({}))

    console.log('Creating business profile for user:', userId)
    
    // Create business profile automatically
    const profile = await createBusinessProfileForUser(
      userId,
      undefined, // userName - will be extracted from userId if needed
      profileName
    )

    // Get DNS setup instructions
    const manager = new NextDNSBusinessManager()
    const dnsConfig = manager.getDNSSetupInstructions(profile)

    console.log('Business profile created successfully:', profile.id)

    return NextResponse.json({
      success: true,
      profile,
      dnsConfiguration: dnsConfig,
      message: 'NextDNS profile created successfully! Configure your devices with the DNS servers below.'
    })
  } catch (error) {
    console.error('Error creating business profile:', error)
    
    let errorMessage = 'Failed to create NextDNS profile'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/nextdns/business/sync - Sync user preferences to business profile
export async function PUT() {
  try {
    console.log('PUT /api/nextdns/business/sync - Syncing preferences')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Syncing preferences for user:', userId)
    await syncBusinessProfilePreferences(userId)

    return NextResponse.json({ 
      success: true,
      message: 'Preferences synced successfully'
    })
  } catch (error) {
    console.error('Error syncing preferences:', error)
    return NextResponse.json(
      { error: 'Failed to sync preferences' },
      { status: 500 }
    )
  }
}

// DELETE /api/nextdns/business - Delete business profile
export async function DELETE() {
  try {
    console.log('DELETE /api/nextdns/business - Deleting business profile')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manager = new NextDNSBusinessManager()
    await manager.deleteUserProfile(userId)

    return NextResponse.json({ 
      success: true,
      message: 'Business profile deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting business profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete business profile' },
      { status: 500 }
    )
  }
}