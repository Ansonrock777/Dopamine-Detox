import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getNextDNSAccount, 
  updateNextDNSAccount, 
  deleteNextDNSAccount
} from '@/lib/nextdns-database'
import { 
  NextDNSBusinessManager,
  getBusinessProfileForUser,
  createBusinessProfileForUser
} from '@/lib/nextdns-business'

// GET /api/nextdns/account - Get user's NextDNS account (manual or business)
export async function GET() {
  try {
    console.log('GET /api/nextdns/account - Starting request')
    const { userId } = await auth()
    console.log('Auth result - userId:', userId)
    
    if (!userId) {
      console.log('No userId found, returning unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check for business profile (new system)
    console.log('Checking for business profile first...')
    const businessProfile = await getBusinessProfileForUser(userId)
    
    if (businessProfile) {
      console.log('Business profile found:', businessProfile.id)
      const manager = new NextDNSBusinessManager()
      const dnsConfig = manager.getDNSSetupInstructions(businessProfile)
      
      return NextResponse.json({ 
        account: {
          id: businessProfile.id,
          profile_id: businessProfile.nextdns_profile_id,
          profile_name: businessProfile.profile_name,
          api_key: 'business-managed',
          is_business_profile: true
        },
        dnsConfiguration: dnsConfig
      })
    }

    // Fall back to manual account (legacy system)
    console.log('No business profile, checking manual account...')
    const account = await getNextDNSAccount(userId)
    console.log('getNextDNSAccount result:', account ? 'Account found' : 'No account found')
    
    if (!account) {
      console.log('No account found, returning null')
      return NextResponse.json({ account: null })
    }

    // Don't return the actual API key for security
    const safeAccount = {
      ...account,
      api_key: account.api_key.substring(0, 8) + '...',
      is_business_profile: false
    }

    console.log('Returning safe account data:', { id: safeAccount.id, profile_id: safeAccount.profile_id })
    return NextResponse.json({ account: safeAccount })
  } catch (error) {
    console.error('Error getting NextDNS account:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Failed to get NextDNS account' },
      { status: 500 }
    )
  }
}

// POST /api/nextdns/account - Connect NextDNS (auto-create business profile)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { profileName } = body

    console.log('🔄 Checking for existing business profile or creating new one...')
    
    try {
      // This will either return existing profile or create a new one
      // The createBusinessProfileForUser function already handles duplicate detection internally
      const profile = await createBusinessProfileForUser(
        userId,
        undefined, // userName will be derived from user profile
        profileName || 'Dopamine Detox'
      )

      // Get DNS setup instructions
      const manager = new NextDNSBusinessManager()
      const dnsConfig = manager.getDNSSetupInstructions(profile)

      // Check if this was an existing profile or newly created
      const isExisting = await getBusinessProfileForUser(userId)
      const message = isExisting ? 
        'Connected to your existing NextDNS profile!' : 
        'NextDNS profile created successfully! Configure your devices with the DNS servers provided.'

      return NextResponse.json({
        account: {
          id: profile.id,
          profile_id: profile.nextdns_profile_id,
          profile_name: profile.profile_name,
          api_key: 'business-managed',
          is_business_profile: true
        },
        dnsConfiguration: dnsConfig,
        message
      })
    } catch (error) {
      console.error('Failed to connect/create business profile:', error)
      
      let errorMessage = 'Failed to connect or create NextDNS profile'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error connecting NextDNS account:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    let errorMessage = 'Failed to connect NextDNS account'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.stringify(error, null, 2)
    } else {
      errorDetails = String(error)
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/nextdns/account - Update NextDNS account
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    const account = await updateNextDNSAccount(userId, updates)

    // Return safe account data (without full API key)
    const safeAccount = {
      ...account,
      api_key: account.api_key.substring(0, 8) + '...'
    }

    return NextResponse.json({ account: safeAccount })
  } catch (error) {
    console.error('Error updating NextDNS account:', error)
    return NextResponse.json(
      { error: 'Failed to update NextDNS account' },
      { status: 500 }
    )
  }
}

// DELETE /api/nextdns/account - Delete NextDNS account
export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteNextDNSAccount(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NextDNS account:', error)
    return NextResponse.json(
      { error: 'Failed to delete NextDNS account' },
      { status: 500 }
    )
  }
}