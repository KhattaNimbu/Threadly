import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamAskHistory } from '@/lib/gemini';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { MeetingWithItems } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { question?: string };
    const { question } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (question.length > 1000) {
      return NextResponse.json(
        { error: 'Question is too long. Maximum allowed length is 1000 characters.' },
        { status: 413 }
      );
    }

    const isAllowed = await checkRateLimit(userId, 'ask', 20, '1 hour');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can only ask 20 questions per hour.' },
        { status: 429 }
      );
    }

    const supabase = createServerSupabase();

    // Fetch last 10 meetings with their action items
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*, action_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (meetingsError) {
      throw new Error(meetingsError.message);
    }

    const meetingsWithItems = (meetings ?? []) as MeetingWithItems[];

    // Stream Gemini response
    const stream = await streamAskHistory(question, meetingsWithItems);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Meetings-Used': JSON.stringify(
          meetingsWithItems.slice(0, 10).map((m) => ({ id: m.id, title: m.title }))
        ),
      },
    });
  } catch (err) {
    console.error('ask POST error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
