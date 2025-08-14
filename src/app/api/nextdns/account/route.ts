import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getNextDNSAccount, 
  createNextDNSAccount, 
  updateNextDNSAccount, 
  deleteNextDNSAccount,
  initializeNextDNSCategories 
} from '@/lib/nextdns-database'

// GET /api/nextdns/account - Get user's NextDNS account
export async function GET() {
  try {
    console.log('GET /api/nextdns/account - Starting request')
    const { userId } = await auth()
    console.log('Auth result - userId:', userId)
    
    if (!userId) {
      console.log('No userId found, returning unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Calling getNextDNSAccount for userId:', userId)
    const account = await getNextDNSAccount(userId)
    console.log('getNextDNSAccount result:', account ? 'Account found' : 'No account found')
    
    if (!account) {
      console.log('No account found, returning null')
      return NextResponse.json({ account: null })
    }

    // Don't return the actual API key for security
    const safeAccount = {
      ...account,
      api_key: account.api_key.substring(0, 8) + '...'
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

// POST /api/nextdns/account - Connect to existing NextDNS account
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, profileId, profileName } = await request.json()

    if (!apiKey || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, profileId' },
        { status: 400 }
      )
    }

    // Connect to the existing NextDNS account
    const account = await createNextDNSAccount(
      userId,
      apiKey,
      profileId,
      profileName || 'Dopamine Detox'
    )

    // Initialize categories for the user
    await initializeNextDNSCategories(userId)

    // Return safe account data (without full API key)
    const safeAccount = {
      ...account,
      api_key: account.api_key.substring(0, 8) + '...'
    }

    return NextResponse.json({ account: safeAccount })
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
        details: errorDetails
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