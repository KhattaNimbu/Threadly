import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { Meeting } from '@/lib/types';

interface MeetingSummaryCardProps {
  meeting: Meeting;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MeetingSummaryCard({ meeting }: MeetingSummaryCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            {meeting.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
            {formatDate(meeting.met_at)}
            {meeting.duration_estimate && ` - ${meeting.duration_estimate}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {meeting.sentiment && <Badge variant={meeting.sentiment}>{meeting.sentiment}</Badge>}
          {meeting.follow_up_needed && (
            <Badge variant="purple">Follow-up needed</Badge>
          )}
        </div>
      </div>

      {/* Participants */}
      {meeting.participants && meeting.participants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {meeting.participants.map((p) => (
            <div
              key={p}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-ink-2)' }}
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ background: 'var(--color-purple)' }}
              >
                {p[0]?.toUpperCase()}
              </div>
              {p}
            </div>
          ))}
        </div>
      )}

      {/* Topics */}
      {meeting.topics && meeting.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meeting.topics.map((t) => (
            <Badge key={t} variant="default">{t}</Badge>
          ))}
        </div>
      )}

      {/* Summary */}
      {meeting.summary && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-3)' }}>
            Summary
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
            {meeting.summary}
          </p>
        </Card>
      )}

      {/* Decisions */}
      {meeting.decisions && meeting.decisions.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-3)' }}>
            Decisions Made
          </h2>
          <ul className="space-y-2 list-none m-0 p-0">
            {meeting.decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-ink-2)' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                  style={{ background: 'var(--color-teal)' }}
                />
                {d}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
