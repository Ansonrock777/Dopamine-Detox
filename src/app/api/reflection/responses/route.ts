import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      question_id,
      response,
      website_url,
      was_unblocked = false
    } = body;

    if (!question_id || !response || !website_url) {
      return NextResponse.json(
        { error: 'Missing required fields: question_id, response, website_url' },
        { status: 400 }
      );
    }

    // Just return success since we're not storing responses
    const reflectionResponse = {
      id: `response_${Date.now()}`,
      user_id: userId,
      question_id,
      response: response.trim(),
      website_url: website_url.toLowerCase(),
      was_unblocked,
      blocked_at: new Date().toISOString(),
      reflected_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      response: reflectionResponse,
      message: 'Reflection response processed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in reflection response API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's reflection history
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return empty history since we're not storing responses
    return NextResponse.json({
      responses: [],
      count: 0
    });

  } catch (error) {
    console.error('Unexpected error in reflection history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}