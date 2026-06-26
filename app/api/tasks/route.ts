import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionItemWithMeeting, Priority } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const priority = searchParams.get('priority') as Priority | 'all' | null;
    const status = searchParams.get('status') as 'open' | 'completed' | 'all' | null;
    const assignee = searchParams.get('assignee');
    const sort = searchParams.get('sort') as 'due_date' | 'priority' | 'meeting_date' | null;

    const supabase = createServerSupabase();

    let query = supabase
      .from('action_items')
      .select(`
        *,
        meetings!inner(id, title, met_at)
      `)
      .eq('user_id', userId);

    // Apply filters
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (status === 'open') {
      query = query.eq('completed', false);
    } else if (status === 'completed') {
      query = query.eq('completed', true);
    }

    if (assignee) {
      query = query.ilike('assignee', `%${assignee}%`);
    }

    // Sorting
    const sortColumn = sort === 'meeting_date' ? 'created_at' : (sort === 'priority' ? 'priority' : 'due_date');
    query = query.order(sortColumn, { ascending: true, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Reshape to include meeting title
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

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('tasks GET error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
