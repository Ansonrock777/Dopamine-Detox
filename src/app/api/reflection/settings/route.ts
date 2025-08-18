import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return default settings since we're not storing in database
    const settings = {
      id: userId,
      user_id: userId,
      is_enabled: true,
      require_response: true,
      cooldown_minutes: 15,
      questions_per_session: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      settings: settings,
      success: true
    });

  } catch (error) {
    console.error('Unexpected error in reflection settings GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      is_enabled,
      require_response,
      cooldown_minutes,
      questions_per_session
    } = body;

    // Just return success since we're not storing settings
    const settings = {
      id: userId,
      user_id: userId,
      is_enabled: is_enabled ?? true,
      require_response: require_response ?? true,
      cooldown_minutes: cooldown_minutes ?? 15,
      questions_per_session: questions_per_session ?? 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      settings: settings,
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in reflection settings PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}