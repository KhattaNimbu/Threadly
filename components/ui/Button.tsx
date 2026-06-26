'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none',
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: 'nowrap' as const,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '15px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-ink)',
      color: '#ffffff',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-ink)',
      border: '0.5px solid var(--color-surface-3)',
    },
    danger: {
      background: 'var(--color-coral-light)',
      color: 'var(--color-coral-dark)',
      border: '0.5px solid #f0c4b8',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          if (variant === 'primary') {
            e.currentTarget.style.background = 'var(--color-ink-2)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.background = 'var(--color-surface-2)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyles[variant].background as string;
        }
      }}
      className={className}
      {...props}
    >
      {loading && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 6" />
        </svg>
      )}
      {children}
    </button>
  );
}
