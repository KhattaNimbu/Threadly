import Link from 'next/link';
import Card from '@/components/ui/Card';
import type { PatternInsight, InsightType } from '@/lib/types';

interface InsightCardProps {
  insight: PatternInsight;
}

const iconMap: Record<InsightType, React.ReactNode> = {
  recurring_topic: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3a7 7 0 100 14A7 7 0 0010 3z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 7v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  ownership_gap: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 5l2-2M16 5l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  meeting_health: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10l3-4 3 2 3-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  risk: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L2 17h16L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 9v4M10 15v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const colorMap: Record<InsightType, { bg: string; color: string }> = {
  recurring_topic: { bg: 'var(--color-purple-light)', color: 'var(--color-purple)' },
  ownership_gap: { bg: 'var(--color-amber-light)', color: 'var(--color-amber-dark)' },
  meeting_health: { bg: 'var(--color-teal-light)', color: 'var(--color-teal)' },
  risk: { bg: 'var(--color-coral-light)', color: 'var(--color-coral-dark)' },
};

const labelMap: Record<InsightType, string> = {
  recurring_topic: 'Recurring Topic',
  ownership_gap: 'Ownership Gap',
  meeting_health: 'Meeting Health',
  risk: 'Risk',
};

export default function InsightCard({ insight }: InsightCardProps) {
  const colors = colorMap[insight.type] ?? colorMap.risk;
  const icon = iconMap[insight.type] ?? iconMap.risk;

  return (
    <Card className="flex flex-col gap-3">
      {/* Icon + type label */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg, color: colors.color }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.color }}
        >
          {labelMap[insight.type] ?? insight.type}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
        {insight.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
        {insight.description}
      </p>

      {/* Affected meetings */}
      {insight.meetings_affected.length > 0 && (
        <div
          className="pt-3 flex flex-wrap gap-2"
          style={{ borderTop: '0.5px solid var(--color-surface-3)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
            Affected meetings:
          </span>
          {insight.meetings_affected.map((id) => (
            <Link
              key={id}
              href={`/meeting/${id}`}
              className="text-xs font-medium no-underline"
              style={{ color: 'var(--color-purple)' }}
            >
              View {'->'}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
