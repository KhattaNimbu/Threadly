import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateInsights } from '@/lib/gemini';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Fetch last 20 meetings for this user
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    if (!meetings || meetings.length < 2) {
      return NextResponse.json({ insights: [] });
    }

    const insights = await generateInsights(meetings);

    return NextResponse.json(
      { insights },
      {
        headers: {
          'Cache-Control': 'private, max-age=300', // 5 minutes
        },
      }
    );
  } catch (err) {
    console.error('insights GET error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate insights';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
