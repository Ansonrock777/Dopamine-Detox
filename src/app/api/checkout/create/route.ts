import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    console.log('🛒 API: Creating Polar checkout...')

    const { userId } = await auth()

    if (!userId) {
      console.log('❌ API: No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { priceAmount } = body

    console.log('💰 API: Creating checkout with amount:', priceAmount)

    // Get Polar configuration from environment
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN
    const polarOrganizationId = process.env.POLAR_ORGANIZATION_ID
    const polarProductId = process.env.POLAR_PRODUCT_ID

    if (!polarAccessToken || !polarOrganizationId || !polarProductId) {
      console.error('❌ API: Missing Polar configuration')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    // Create Polar checkout session
    const checkoutData = {
      organization_id: polarOrganizationId,
      product_id: polarProductId,
      customer_email: null, // Polar will collect this
      metadata: {
        user_id: userId,
        source: 'dopamine_detox'
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`
    }

    console.log('🔄 API: Sending request to Polar:', checkoutData)

    const polarResponse = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData)
    })

    if (!polarResponse.ok) {
      const errorText = await polarResponse.text()
      console.error('❌ API: Polar API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    const checkoutSession = await polarResponse.json()
    console.log('✅ API: Checkout session created:', checkoutSession.id)

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      checkoutId: checkoutSession.id
    })
  } catch (error) {
    console.error('❌ API: Error creating checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}