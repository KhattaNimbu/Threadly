import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import MeetingCard from '@/components/meeting/MeetingCard';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import type { Meeting } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Dashboard',
};

function StatCard({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          {sublabel}
        </p>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabase();
  const now = new Date();

  // Start of this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Start of this week (Monday)
  const day = now.getDay();
  const weekOffset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - weekOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Parallel fetches
  const [meetingsResult, tasksResult, recentResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, met_at')
      .eq('user_id', userId)
      .gte('met_at', monthStart),
    supabase
      .from('action_items')
      .select('id, completed')
      .eq('user_id', userId),
    supabase
      .from('meetings')
      .select('*, action_items(id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const meetings = meetingsResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const recentMeetings = (recentResult.data ?? []) as Array<Meeting & {
    action_items: { id: string }[];
  }>;

  // Stats
  const meetingsThisMonth = meetings.length;
  const meetingsThisWeek = meetings.filter(
    (m) => new Date(m.met_at) >= weekStart
  ).length;
  const openTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/meeting/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white no-underline"
          style={{ background: 'var(--color-ink)' }}
          id="new-meeting-btn"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
            <path d="M7 4.5v5M4.5 7h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Meeting
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Meetings this month"
          value={meetingsThisMonth}
        />
        <StatCard
          label="Open tasks"
          value={openTasks}
          sublabel={`${totalTasks} total tasks`}
        />
        <StatCard
          label="Tasks completed"
          value={`${completedPct}%`}
          sublabel={`${completedTasks} of ${totalTasks}`}
        />
        <StatCard
          label="Meetings this week"
          value={meetingsThisWeek}
        />
      </div>

      {/* Recent meetings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
            Recent meetings
          </h2>
          <Link
            href="/meeting/new"
            className="text-xs no-underline font-medium"
            style={{ color: 'var(--color-purple)' }}
          >
            + Add meeting
          </Link>
        </div>

        {recentMeetings.length === 0 ? (
          <EmptyState
            title="No meetings yet"
            description="Paste your first meeting transcript to get started with AI-powered summaries and action items."
            action={{ label: 'Analyse first meeting', href: '/meeting/new' }}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="var(--color-ink-3)" strokeWidth="1.5" />
                <path d="M8 9h8M8 13h5M3 8h18" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={{
                  ...m,
                  action_item_count: m.action_items.length,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
