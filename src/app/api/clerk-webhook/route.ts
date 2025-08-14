import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    console.log('🔗 Clerk webhook received')
    
    // Get the webhook payload
    const payload = await req.json()
    const { type, data } = payload
    
    console.log('📝 Webhook event:', type)
    console.log('👤 User data:', data?.id)

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Call the webhook handler function
    console.log('🔄 Calling handle_clerk_webhook function...')
    const { error } = await supabase.rpc('handle_clerk_webhook', {
      event_type: type,
      user_data: data
    })

    if (error) {
      console.error('❌ Error handling webhook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ success: true, event: type })

  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}