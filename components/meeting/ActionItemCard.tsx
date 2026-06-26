'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { ActionItem } from '@/lib/types';

interface ActionItemCardProps {
  item: ActionItem;
  onToggle: (id: string, completed: boolean) => void;
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = date < today && !dateStr;

  return {
    label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isOverdue,
  };
}

export default function ActionItemCard({ item, onToggle }: ActionItemCardProps) {
  const [loading, setLoading] = useState(false);
  const dueInfo = item.due_date ? formatDueDate(item.due_date) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = item.due_date ? new Date(item.due_date + 'T00:00:00') : null;
  const isOverdue = dueDate && dueDate < today && !item.completed;

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(item.id, !item.completed);
    setLoading(false);
  };

  return (
    <div
      className="flex items-start gap-3 py-3 px-1"
      style={{
        borderLeft: isOverdue ? '3px solid var(--color-coral-dark)' : '3px solid transparent',
        paddingLeft: isOverdue ? '10px' : '4px',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
        className="flex-shrink-0 mt-0.5"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          border: item.completed ? 'none' : '1.5px solid var(--color-surface-3)',
          background: item.completed ? 'var(--color-teal)' : 'transparent',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        {item.completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: item.completed ? 'var(--color-ink-3)' : 'var(--color-ink)',
            textDecoration: item.completed ? 'line-through' : 'none',
          }}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.assignee && (
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ background: 'var(--color-ink-2)' }}
              >
                {item.assignee[0]?.toUpperCase()}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
                {item.assignee}
              </span>
            </div>
          )}
          {dueInfo && (
            <span
              className="text-xs"
              style={{ color: isOverdue ? 'var(--color-coral-dark)' : 'var(--color-ink-3)' }}
            >
              {isOverdue ? '! ' : ''}{dueInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <Badge variant={item.priority}>{item.priority}</Badge>
    </div>
  );
}
