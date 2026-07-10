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

function StatCard({
  label,
  value,
  sublabel,
  icon,
  accentColor = 'var(--color-primary)',
  accentBg = 'var(--color-primary-muted)',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  accentBg?: string;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.1 }}>
            {value}
          </p>
          {sublabel && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: accentBg,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const day = now.getDay();
  const weekOffset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - weekOffset);
  weekStart.setHours(0, 0, 0, 0);

  const [meetingsResult, tasksResult, recentResult] = await Promise.all([
    supabase.from('meetings').select('id, met_at').eq('user_id', userId).gte('met_at', monthStart),
    supabase.from('action_items').select('id, completed').eq('user_id', userId),
    supabase.from('meetings').select('*, action_items(id)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  const meetings = meetingsResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const recentMeetings = (recentResult.data ?? []) as Array<Meeting & { action_items: { id: string }[] }>;

  const meetingsThisMonth = meetings.length;
  const meetingsThisWeek = meetings.filter((m) => new Date(m.met_at) >= weekStart).length;
  const openTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/meeting/new"
          id="new-meeting-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--color-primary)',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(89, 50, 234, 0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Meeting
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          label="Meetings this month"
          value={meetingsThisMonth}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Open tasks"
          value={openTasks}
          sublabel={`${totalTasks} total tasks`}
          accentColor="var(--color-danger)"
          accentBg="var(--color-danger-bg)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <StatCard
          label="Tasks completed"
          value={`${completedPct}%`}
          sublabel={`${completedTasks} of ${totalTasks}`}
          accentColor="var(--color-success)"
          accentBg="var(--color-success-bg)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Meetings this week"
          value={meetingsThisWeek}
          accentColor="var(--color-warning)"
          accentBg="var(--color-warning-bg)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Recent meetings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Recent Meetings
          </h2>
          <Link
            href="/meeting/new"
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 9h8M8 13h5M3 8h18" />
              </svg>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {recentMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={{ ...m, action_item_count: m.action_items.length }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
