import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Illustration */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--color-surface-2)' }}
      >
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-ink-3)" strokeWidth="1.5" />
            <path d="M8 12h8M8 8h5M8 16h3" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Text */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--color-ink)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-xs mb-6"
        style={{ color: 'var(--color-ink-3)' }}
      >
        {description}
      </p>

      {/* CTA */}
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button variant="primary" size="md">
              {action.label}
            </Button>
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
