import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('🔗 Test webhook received!')
  
  try {
    const body = await req.text()
    console.log('📦 Raw body:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook working!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is running!',
    timestamp: new Date().toISOString()
  })
}