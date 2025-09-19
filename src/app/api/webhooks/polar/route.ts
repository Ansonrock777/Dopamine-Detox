import { NextRequest, NextResponse } from 'next/server'
import { updateUserPaymentStatus } from '@/lib/database'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    console.log('🎣 Webhook: Received Polar webhook...')

    // Get webhook secret from environment
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ Webhook: Missing webhook secret')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('polar-signature')

    if (!signature) {
      console.error('❌ Webhook: Missing signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify webhook signature
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    const expectedSignature = `sha256=${computedSignature}`

    if (signature !== expectedSignature) {
      console.error('❌ Webhook: Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Webhook: Signature verified')

    // Parse the webhook payload
    const event = JSON.parse(body)
    console.log('📨 Webhook: Event type:', event.type)
    console.log('📊 Webhook: Event data:', JSON.stringify(event.data, null, 2))

    // Handle different webhook events
    switch (event.type) {
      case 'order.created':
      case 'checkout.completed':
        await handlePaymentSuccess(event.data)
        break

      case 'order.failed':
      case 'checkout.failed':
        await handlePaymentFailed(event.data)
        break

      default:
        console.log('ℹ️ Webhook: Unhandled event type:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook: Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(data: {
  metadata?: { user_id?: string };
  customer?: { id?: string; metadata?: { user_id?: string } };
  customer_id?: string;
  id: string;
  amount?: number;
  total_amount?: number;
  currency?: string;
}) {
  try {
    console.log('💰 Webhook: Processing successful payment...')

    // Extract user ID from metadata
    const userId = data.metadata?.user_id || data.customer?.metadata?.user_id

    if (!userId) {
      console.error('❌ Webhook: No user ID found in payment data')
      throw new Error('User ID not found in payment metadata')
    }

    // Extract payment details
    const customerId = data.customer?.id || data.customer_id || 'unknown'
    const orderId = data.id
    const amount = data.amount || data.total_amount || 0
    const currency = data.currency || 'USD'

    console.log('💳 Webhook: Payment details:', {
      userId,
      customerId,
      orderId,
      amount,
      currency
    })

    // Update user payment status in database
    await updateUserPaymentStatus(
      userId,
      customerId,
      orderId,
      amount / 100, // Convert from cents to dollars
      currency
    )

    console.log('✅ Webhook: Payment status updated successfully')
  } catch (error) {
    console.error('❌ Webhook: Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(data: {
  metadata?: { user_id?: string };
  customer?: { metadata?: { user_id?: string } };
  id: string;
}) {
  try {
    console.log('❌ Webhook: Processing failed payment...')

    const userId = data.metadata?.user_id || data.customer?.metadata?.user_id
    const orderId = data.id

    console.log('💔 Webhook: Payment failed for user:', userId, 'order:', orderId)

    // Log the failure (could send email notification here)
    console.log('📝 Webhook: Payment failure logged')
  } catch (error) {
    console.error('❌ Webhook: Error handling payment failure:', error)
    throw error
  }
}