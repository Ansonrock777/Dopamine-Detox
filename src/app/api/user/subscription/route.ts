import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUserPaymentStatus } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 API: Checking user subscription status...')

    const { userId } = await auth()

    if (!userId) {
      console.log('❌ API: No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('👤 API: Checking payment status for user:', userId)

    const paymentStatus = await checkUserPaymentStatus(userId)

    console.log('💰 API: Payment status result:', paymentStatus)

    return NextResponse.json(paymentStatus)
  } catch (error) {
    console.error('❌ API: Error checking subscription status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check subscription status',
        hasPaid: false,
        subscriptionStatus: 'free'
      },
      { status: 500 }
    )
  }
}