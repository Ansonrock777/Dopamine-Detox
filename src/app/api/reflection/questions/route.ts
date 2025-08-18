import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const limit = parseInt(searchParams.get('limit') || '1');

    // Get random reflection questions for the specified category
    const { data: questions, error } = await supabase
      .rpc('get_random_reflection_questions', {
        p_category: category,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching reflection questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reflection questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: questions || [],
      category,
      count: questions?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in reflection questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all available categories
export async function OPTIONS() {
  try {
    // Get distinct categories using a raw query since Supabase doesn't support .group()
    const { data: categories, error } = await supabase
      .from('reflection_questions')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching question categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Get unique categories manually
    const categorySet = new Set(categories?.map(c => c.category) || []);
    const categoryList = Array.from(categorySet);

    return NextResponse.json({
      categories: categoryList,
      available: ['social_media', 'shopping', 'news', 'gaming', 'general']
    });

  } catch (error) {
    console.error('Unexpected error in reflection categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}