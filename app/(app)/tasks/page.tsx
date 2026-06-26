import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import TaskBoard from '@/components/tasks/TaskBoard';
import EmptyState from '@/components/ui/EmptyState';
import type { ActionItemWithMeeting } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Tasks',
};

export default async function TasksPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('action_items')
    .select(`
      *,
      meetings!inner(id, title, met_at)
    `)
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '3px solid var(--color-coral-dark)' }}>
        <p className="text-sm" style={{ color: 'var(--color-coral-dark)' }}>
          Failed to load tasks: {error.message}
        </p>
      </div>
    );
  }

  const tasks: ActionItemWithMeeting[] = (data ?? []).map((item) => ({
    id: item.id,
    meeting_id: item.meeting_id,
    user_id: item.user_id,
    title: item.title,
    assignee: item.assignee,
    due_date: item.due_date,
    priority: item.priority,
    completed: item.completed,
    created_at: item.created_at,
    meeting_title: (item.meetings as { id: string; title: string; met_at: string }).title,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          Tasks
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
          All action items across your meetings
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Action items from your meetings will appear here once you analyse a transcript."
          action={{ label: 'Analyse a meeting', href: '/meeting/new' }}
        />
      ) : (
        <TaskBoard initialTasks={tasks} />
      )}
    </div>
  );
}
