import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { formatMeetingExport } from '@/lib/gemini';
import { exportMeetingToEmail } from '@/lib/export';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ExportDestination, ExportFormat, MeetingWithItems } from '@/lib/types';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      meeting_id?: string;
      format?: ExportFormat;
      destination?: ExportDestination;
      recipient_email?: string;
    };
    const {
      meeting_id,
      format,
      destination = 'clipboard',
      recipient_email,
    } = body;

    if (!meeting_id) {
      return NextResponse.json({ error: 'meeting_id is required' }, { status: 400 });
    }

    if (!format || !['notion', 'slack', 'email'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be one of: notion, slack, email' },
        { status: 400 }
      );
    }

    if (!['clipboard', 'email'].includes(destination)) {
      return NextResponse.json(
        { error: 'destination must be one of: clipboard, email' },
        { status: 400 }
      );
    }

    if (destination === 'email') {
      const trimmedEmail = recipient_email?.trim();

      if (!trimmedEmail) {
        return NextResponse.json({ error: 'recipient_email is required' }, { status: 400 });
      }

      if (!isValidEmail(trimmedEmail)) {
        return NextResponse.json({ error: 'recipient_email must be a valid email address' }, { status: 400 });
      }
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

    if (destination === 'clipboard') {
      return NextResponse.json({ content });
    }

    const recipientEmail = recipient_email!.trim();
    const exportLogInsert = await supabase
      .from('export_logs')
      .insert({
        user_id: userId,
        meeting_id,
        destination_type: 'email',
        recipient: recipientEmail,
        status: 'pending',
        provider: 'resend',
      })
      .select('id')
      .single();

    const exportLogId = exportLogInsert.data?.id as string | undefined;

    try {
      const result = await exportMeetingToEmail({
        meeting: meeting as MeetingWithItems,
        recipientEmail,
        content,
        formatLabel: format,
      });

      if (exportLogId) {
        await supabase
          .from('export_logs')
          .update({
            status: 'sent',
            provider: result.provider,
            error_message: null,
          })
          .eq('id', exportLogId)
          .eq('user_id', userId);
      }

      return NextResponse.json({
        success: true,
        delivered_to: recipientEmail,
        provider: result.provider,
      });
    } catch (emailError) {
      if (exportLogId) {
        await supabase
          .from('export_logs')
          .update({
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : 'Failed to send email export',
          })
          .eq('id', exportLogId)
          .eq('user_id', userId);
      }

      throw emailError;
    }
  } catch (err) {
    console.error('export POST error:', err);
    const message = err instanceof Error ? err.message : 'Failed to export meeting';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
