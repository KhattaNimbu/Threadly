'use client';

import { useState, useCallback } from 'react';
import ActionItemCard from './ActionItemCard';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { ActionItem } from '@/lib/types';

interface ActionItemListProps {
  initialItems: ActionItem[];
}

export default function ActionItemList({ initialItems }: ActionItemListProps) {
  const [items, setItems] = useState<ActionItem[]>(initialItems);

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to update task');
      }

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed } : item))
      );
    } catch (err) {
      console.error('Toggle error:', err);
    }
  }, []);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No action items"
        description="This meeting had no explicit action items assigned."
      />
    );
  }

  const open = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-3)' }}>
        Action Items - {open.length} open, {done.length} done
      </h2>

      <div className="divide-y" style={{ borderColor: 'var(--color-surface-2)' }}>
        {/* Open items first */}
        {open.map((item) => (
          <ActionItemCard key={item.id} item={item} onToggle={handleToggle} />
        ))}
        {/* Completed items */}
        {done.map((item) => (
          <ActionItemCard key={item.id} item={item} onToggle={handleToggle} />
        ))}
      </div>
    </Card>
  );
}
