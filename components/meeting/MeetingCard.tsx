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
    <Link href={`/meeting/${meeting.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <Card hover>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meeting.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0 0' }}>
              {formatDate(meeting.met_at)}
              {meeting.duration_estimate && ` · ${meeting.duration_estimate}`}
            </p>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {meeting.sentiment && (
              <Badge variant={meeting.sentiment}>
                {meeting.sentiment}
              </Badge>
            )}
          </div>
        </div>

        {/* Topics */}
        {meeting.topics && meeting.topics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {meeting.topics.slice(0, 4).map((topic) => (
              <Badge key={topic} variant="default">
                {topic}
              </Badge>
            ))}
            {meeting.topics.length > 4 && (
              <Badge variant="purple">+{meeting.topics.length - 4} more</Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            {meeting.participants && meeting.participants.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {meeting.participants.slice(0, 3).join(', ')}
                {meeting.participants.length > 3 && ` +${meeting.participants.length - 3}`}
              </span>
            )}
          </div>
          {typeof meeting.action_item_count !== 'undefined' && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: meeting.action_item_count > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: meeting.action_item_count > 0 ? 'var(--color-primary-muted)' : 'transparent',
                padding: meeting.action_item_count > 0 ? '2px 8px' : '0',
                borderRadius: '20px',
              }}
            >
              {meeting.action_item_count} task{meeting.action_item_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
