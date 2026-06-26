import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { Meeting } from '@/lib/types';

interface MeetingCardProps {
  meeting: Meeting & { action_item_count?: number };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link href={`/meeting/${meeting.id}`} className="no-underline block">
      <Card
        hover
        className="flex flex-col gap-3"
        style={{ transition: 'border-color 0.15s ease' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate"
              style={{ color: 'var(--color-ink)' }}
            >
              {meeting.title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-3)' }}>
              {formatDate(meeting.met_at)}
              {meeting.duration_estimate && ` - ${meeting.duration_estimate}`}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {meeting.sentiment && (
              <Badge variant={meeting.sentiment}>
                {meeting.sentiment}
              </Badge>
            )}
          </div>
        </div>

        {/* Topics */}
        {meeting.topics && meeting.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meeting.topics.slice(0, 4).map((topic) => (
              <Badge key={topic} variant="default">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1" style={{ borderTop: '0.5px solid var(--color-surface-3)' }}>
          <div className="flex items-center gap-1.5">
            {meeting.participants && meeting.participants.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
                {meeting.participants.slice(0, 3).join(', ')}
                {meeting.participants.length > 3 && ` +${meeting.participants.length - 3}`}
              </span>
            )}
          </div>
          {typeof meeting.action_item_count !== 'undefined' && (
            <span
              className="text-xs font-medium"
              style={{ color: meeting.action_item_count > 0 ? 'var(--color-purple)' : 'var(--color-ink-3)' }}
            >
              {meeting.action_item_count} task{meeting.action_item_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
