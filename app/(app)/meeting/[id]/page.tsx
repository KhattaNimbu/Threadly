import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import MeetingSummaryCard from '@/components/meeting/MeetingSummaryCard';
import ActionItemList from '@/components/meeting/ActionItemList';
import ExportButton from '@/components/meeting/ExportButton';
import type { MeetingWithItems } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('meetings')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: data?.title ?? 'Meeting',
  };
}

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const supabase = createServerSupabase();

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*, action_items(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const meetingWithItems = meeting as MeetingWithItems;

  return (
    <div className="space-y-8">
      {/* Header actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <MeetingSummaryCard meeting={meetingWithItems} />
        </div>
        <div className="flex-shrink-0 mt-1">
          <ExportButton meetingId={id} />
        </div>
      </div>

      {/* Action items */}
      <ActionItemList initialItems={meetingWithItems.action_items} />

      {/* Raw transcript (collapsed) */}
      {meetingWithItems.raw_transcript && (
        <details
          className="rounded-xl"
          style={{ border: '0.5px solid var(--color-surface-3)' }}
        >
          <summary
            className="px-5 py-4 text-sm font-medium cursor-pointer"
            style={{ color: 'var(--color-ink-2)' }}
          >
            View raw transcript
          </summary>
          <pre
            className="px-5 pb-5 text-xs overflow-auto whitespace-pre-wrap"
            style={{
              color: 'var(--color-ink-3)',
              fontFamily: 'var(--font-mono)',
              maxHeight: '400px',
              borderTop: '0.5px solid var(--color-surface-3)',
              paddingTop: '16px',
            }}
          >
            {meetingWithItems.raw_transcript}
          </pre>
        </details>
      )}
    </div>
  );
}
