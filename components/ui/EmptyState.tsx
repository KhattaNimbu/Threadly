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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--color-primary-muted)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 12h8M8 8h5M8 16h3" />
          </svg>
        )}
      </div>

      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '320px', margin: '0 0 24px', lineHeight: 1.6 }}>
        {description}
      </p>

      {action && (
        action.href ? (
          <a href={action.href} style={{ textDecoration: 'none' }}>
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
