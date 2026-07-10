import type { TaskFilters, Priority, TaskStatus, TaskSortKey } from '@/lib/types';
import Input from '@/components/ui/Input';

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export default function TaskFiltersComponent({ filters, onChange }: TaskFiltersProps) {
  const update = (partial: Partial<TaskFilters>) =>
    onChange({ ...filters, ...partial });

  const priorityOptions: Array<{ value: Priority | 'all'; label: string }> = [
    { value: 'all', label: 'All priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: 'all', label: 'All tasks' },
    { value: 'open', label: 'Open' },
    { value: 'completed', label: 'Completed' },
  ];

  const sortOptions: Array<{ value: TaskSortKey; label: string }> = [
    { value: 'due_date', label: 'Due date' },
    { value: 'priority', label: 'Priority' },
    { value: 'meeting_date', label: 'Meeting date' },
  ];

  const selectStyle: React.CSSProperties = {
    padding: '7px 10px',
    borderRadius: '8px',
    border: '0.5px solid var(--color-surface-3)',
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Priority */}
      <select
        id="filter-priority"
        value={filters.priority}
        onChange={(e) => update({ priority: e.target.value as Priority | 'all' })}
        style={selectStyle}
        aria-label="Filter by priority"
      >
        {priorityOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Status */}
      <select
        id="filter-status"
        value={filters.status}
        onChange={(e) => update({ status: e.target.value as TaskStatus })}
        style={selectStyle}
        aria-label="Filter by status"
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        id="filter-sort"
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as TaskSortKey })}
        style={selectStyle}
        aria-label="Sort by"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>Sort: {o.label}</option>
        ))}
      </select>

      {/* Assignee search */}
      <div style={{ minWidth: '180px' }}>
        <Input
          id="filter-assignee"
          placeholder="Search assignee..."
          value={filters.assignee}
          onChange={(e) => update({ assignee: e.target.value })}
          style={{ margin: 0 }}
        />
      </div>

      {/* Clear filters */}
      {(filters.priority !== 'all' || filters.status !== 'all' || filters.assignee) && (
        <button
          onClick={() => update({ priority: 'all', status: 'all', assignee: '' })}
          className="text-xs"
          style={{ color: 'var(--color-ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
