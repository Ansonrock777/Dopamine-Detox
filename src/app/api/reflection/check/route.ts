import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Set user context for RLS
const setUserContext = async (userId: string) => {
  await supabase.rpc('set_current_user_id', { user_id: userId });
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await setUserContext(userId);

    const { searchParams } = new URL(request.url);
    const website_url = searchParams.get('website_url');

    if (!website_url) {
      return NextResponse.json(
        { error: 'Missing website_url parameter' },
        { status: 400 }
      );
    }

    // Get user's reflection wall settings
    const { data: settings, error: settingsError } = await supabase
      .from('reflection_wall_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no settings exist, create default ones
    let userSettings = settings;
    if (!settings && !settingsError) {
      const { data: newSettings, error: createError } = await supabase
        .from('reflection_wall_settings')
        .insert({
          user_id: userId,
          is_enabled: true,
          require_response: true,
          cooldown_minutes: 15,
          questions_per_session: 1
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default reflection settings:', createError);
      } else {
        userSettings = newSettings;
      }
    }

    // If reflection wall is disabled, allow access
    if (!userSettings?.is_enabled) {
      return NextResponse.json({
        should_block: false,
        reason: 'reflection_disabled',
        settings: userSettings
      });
    }

    // Check if user is in cooldown period for this website
    const { data: inCooldown, error: cooldownError } = await supabase
      .rpc('is_in_reflection_cooldown', {
        p_user_id: userId,
        p_website_url: website_url.toLowerCase(),
        p_cooldown_minutes: userSettings?.cooldown_minutes || 15
      });

    if (cooldownError) {
      console.error('Error checking reflection cooldown:', cooldownError);
    }

    // If in cooldown, don't show reflection wall
    if (inCooldown) {
      return NextResponse.json({
        should_block: false,
        reason: 'in_cooldown',
        settings: userSettings,
        cooldown_remaining: userSettings?.cooldown_minutes || 15
      });
    }

    // Determine category based on website URL
    let category = 'general';
    const url_lower = website_url.toLowerCase();

    if (url_lower.includes('facebook') || url_lower.includes('instagram') || 
        url_lower.includes('twitter') || url_lower.includes('tiktok') ||
        url_lower.includes('snapchat') || url_lower.includes('linkedin')) {
      category = 'social_media';
    } else if (url_lower.includes('amazon') || url_lower.includes('ebay') ||
               url_lower.includes('shop') || url_lower.includes('store')) {
      category = 'shopping';
    } else if (url_lower.includes('news') || url_lower.includes('cnn') ||
               url_lower.includes('bbc') || url_lower.includes('reddit')) {
      category = 'news';
    } else if (url_lower.includes('game') || url_lower.includes('steam') ||
               url_lower.includes('twitch') || url_lower.includes('xbox')) {
      category = 'gaming';
    }

    // Should show reflection wall
    return NextResponse.json({
      should_block: true,
      reason: 'show_reflection',
      settings: userSettings,
      suggested_category: category,
      website_url: website_url.toLowerCase()
    });

  } catch (error) {
    console.error('Unexpected error in reflection check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}