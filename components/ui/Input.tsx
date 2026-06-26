'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: 'var(--color-ink)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-150 ${className}`}
        style={{
          border: error
            ? '0.5px solid var(--color-coral-dark)'
            : '0.5px solid var(--color-surface-3)',
          background: '#ffffff',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-sans)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = `0.5px solid var(--color-purple)`;
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-purple-light)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error
            ? '0.5px solid var(--color-coral-dark)'
            : '0.5px solid var(--color-surface-3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-coral-dark)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
