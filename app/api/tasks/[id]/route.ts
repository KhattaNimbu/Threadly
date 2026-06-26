import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as { completed?: boolean };
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'completed field must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: task, error } = await supabase
      .from('action_items')
      .update({ completed })
      .eq('id', id)
      .eq('user_id', userId) // Enforce ownership
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error('task PATCH error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
