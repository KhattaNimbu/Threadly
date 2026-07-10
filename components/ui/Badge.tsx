import type { Priority, Sentiment } from '@/lib/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Priority | Sentiment | 'default' | 'purple';
  className?: string;
}

const variantMap: Record<string, string> = {
  high:       'badge-high',
  medium:     'badge-medium',
  low:        'badge-low',
  productive: 'badge-productive',
  tense:      'badge-tense',
  unclear:    'badge-unclear',
  routine:    'badge-routine',
  default:    '',
  purple:     '',
};

const inlineStyles: Record<string, React.CSSProperties> = {
  purple: {
    background: 'var(--color-primary-muted)',
    color:      'var(--color-primary)',
  },
  default: {
    background: 'var(--color-border)',
    color:      'var(--color-text-muted)',
  },
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const badgeClass = variantMap[variant] || '';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass} ${className}`}
      style={variant === 'purple' || variant === 'default' ? inlineStyles[variant] : undefined}
    >
      {children}
    </span>
  );
}
