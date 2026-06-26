'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import TaskFiltersComponent from './TaskFilters';
import type { ActionItemWithMeeting, TaskFilters, Priority } from '@/lib/types';

interface TaskBoardProps {
  initialTasks: ActionItemWithMeeting[];
}

const defaultFilters: TaskFilters = {
  priority: 'all',
  status: 'open',
  assignee: '',
  sort: 'due_date',
};

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function applyFilters(tasks: ActionItemWithMeeting[], filters: TaskFilters): ActionItemWithMeeting[] {
  let result = [...tasks];

  if (filters.priority !== 'all') {
    result = result.filter((t) => t.priority === filters.priority);
  }

  if (filters.status === 'open') {
    result = result.filter((t) => !t.completed);
  } else if (filters.status === 'completed') {
    result = result.filter((t) => t.completed);
  }

  if (filters.assignee.trim()) {
    const q = filters.assignee.toLowerCase();
    result = result.filter((t) => t.assignee?.toLowerCase().includes(q));
  }

  result.sort((a, b) => {
    if (filters.sort === 'priority') {
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    }
    if (filters.sort === 'due_date') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    // meeting_date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return result;
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState<ActionItemWithMeeting[]>(initialTasks);
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed } : t))
        );
      }
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const filtered = applyFilters(tasks, filters);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      <TaskFiltersComponent filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters or add a new meeting to generate action items."
          action={{ label: 'New Meeting', href: '/meeting/new' }}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </p>
          {filtered.map((task) => {
            const dueDate = task.due_date ? new Date(task.due_date + 'T00:00:00') : null;
            const isOverdue = dueDate && dueDate < today && !task.completed;
            const isToggling = togglingIds.has(task.id);

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 py-3 px-4 rounded-xl"
                style={{
                  background: '#ffffff',
                  border: '0.5px solid var(--color-surface-3)',
                  borderLeft: isOverdue ? '3px solid var(--color-coral-dark)' : '0.5px solid var(--color-surface-3)',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(task.id, !task.completed)}
                  disabled={isToggling}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: task.completed ? 'none' : '1.5px solid var(--color-surface-3)',
                    background: task.completed ? 'var(--color-teal)' : 'transparent',
                    cursor: isToggling ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    opacity: isToggling ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {task.completed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: task.completed ? 'var(--color-ink-3)' : 'var(--color-ink)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {task.assignee && (
                      <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
                        {task.assignee}
                      </span>
                    )}
                    {task.due_date && (
                      <span
                        className="text-xs"
                        style={{ color: isOverdue ? 'var(--color-coral-dark)' : 'var(--color-ink-3)' }}
                      >
                        {isOverdue ? '! Overdue - ' : ''}{formatDueDate(task.due_date)}
                      </span>
                    )}
                    <Link
                      href={`/meeting/${task.meeting_id}`}
                      className="text-xs no-underline"
                      style={{ color: 'var(--color-purple)' }}
                    >
                      {task.meeting_title}
                    </Link>
                  </div>
                </div>

                <Badge variant={task.priority}>{task.priority}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
