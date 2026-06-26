import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { formatMeetingExport } from '@/lib/gemini';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ExportFormat, MeetingWithItems } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { meeting_id?: string; format?: ExportFormat };
    const { meeting_id, format } = body;

    if (!meeting_id) {
      return NextResponse.json({ error: 'meeting_id is required' }, { status: 400 });
    }

    if (!format || !['notion', 'slack', 'email'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be one of: notion, slack, email' },
        { status: 400 }
      );
    }

    const isAllowed = await checkRateLimit(userId, 'export', 20, '1 hour');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can only export 20 times per hour.' },
        { status: 429 }
      );
    }

    const supabase = createServerSupabase();

    // Fetch meeting + action items, enforce ownership
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, action_items(*)')
      .eq('id', meeting_id)
      .eq('user_id', userId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: 'Meeting not found or access denied' },
        { status: 404 }
      );
    }

    const content = await formatMeetingExport(meeting as MeetingWithItems, format);

    return NextResponse.json({ content });
  } catch (err) {
    console.error('export POST error:', err);
    const message = err instanceof Error ? err.message : 'Failed to export meeting';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
