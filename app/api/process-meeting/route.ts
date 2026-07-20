import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { analyseMeeting } from '@/lib/gemini';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { syncAuthenticatedUser } from '@/lib/user-sync';
import { generateMeetingSearchEmbedding, toVectorLiteral } from '@/lib/meeting-search';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json() as { transcript?: string };
    const { transcript } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (transcript.length > 100000) {
      return NextResponse.json(
        { error: 'Transcript is too long. Maximum allowed length is 100,000 characters.' },
        { status: 413 }
      );
    }

    // 3. Rate Limit (20 per hour)
    const isAllowed = await checkRateLimit(userId, 'process-meeting', 20, '1 hour');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can only process 20 meetings per hour.' },
        { status: 429 }
      );
    }

    // 4. Call Gemini to analyse
    const analysis = await analyseMeeting(transcript.trim());

    // 5. Save to Supabase
    await syncAuthenticatedUser(userId);

    const supabase = createServerSupabase();

    // Insert meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: userId,
        title: analysis.title,
        raw_transcript: transcript,
        summary: analysis.summary,
        decisions: analysis.decisions,
        topics: analysis.topics,
        participants: analysis.participants,
        sentiment: analysis.sentiment,
        follow_up_needed: analysis.follow_up_meeting_needed,
        duration_estimate: analysis.duration_estimate,
        met_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (meetingError || !meeting) {
      console.error('Meeting insert error:', meetingError);
      throw new Error(meetingError?.message ?? 'Failed to save meeting');
    }

    // Batch insert action items
    if (analysis.action_items.length > 0) {
      const actionItemRows = analysis.action_items.map((item) => ({
        meeting_id: meeting.id,
        user_id: userId,
        title: item.title,
        assignee: item.assignee ?? null,
        due_date: item.due_date ?? null,
        priority: item.priority,
        completed: false,
      }));

      const { error: itemsError } = await supabase
        .from('action_items')
        .insert(actionItemRows);

      if (itemsError) {
        console.error('Action items insert error:', itemsError);
        // Non-fatal: continue even if items fail
      }
    }

    try {
      const embedding = await generateMeetingSearchEmbedding({
        transcript: transcript.trim(),
        analysis,
      });

      const { error: embeddingError } = await supabase
        .from('meetings')
        .update({ content_embedding: toVectorLiteral(embedding) })
        .eq('id', meeting.id)
        .eq('user_id', userId);

      if (embeddingError) {
        console.error('Meeting embedding update error:', embeddingError);
      }
    } catch (embeddingError) {
      console.error('Meeting embedding generation error:', embeddingError);
    }

    return NextResponse.json({
      meeting_id: meeting.id,
      analysis,
    });
  } catch (err) {
    console.error('process-meeting error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
