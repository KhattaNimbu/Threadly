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
    fontWeight: 600,
    borderRadius: '10px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none',
    opacity: disabled || loading ? 0.55 : 1,
    whiteSpace: 'nowrap' as const,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px',  fontSize: '12px' },
    md: { padding: '8px 18px',  fontSize: '14px' },
    lg: { padding: '12px 28px', fontSize: '15px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-primary)',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(89, 50, 234, 0.3)',
    },
    ghost: {
      background: 'var(--color-surface)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      background: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(192, 57, 43, 0.2)',
    },
  };

  const hoverStyles: Record<string, Partial<React.CSSProperties>> = {
    primary: { background: 'var(--color-primary-hover)', boxShadow: '0 4px 14px rgba(89, 50, 234, 0.4)' },
    ghost:   { background: 'var(--color-surface-hover)', borderColor: 'var(--color-border-strong)' },
    danger:  { background: 'var(--color-danger-bg)' },
  };

  return (
    <button
      style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] }}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
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
