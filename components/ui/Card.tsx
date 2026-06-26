'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = '', style, onClick, hover = false }: CardProps) {
  return (
    <div
      className={`card ${hover ? 'cursor-pointer' : ''} ${className}`}
      style={{
        transition: hover ? 'border-color 0.15s ease, background 0.15s ease' : undefined,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = 'var(--color-purple)';
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = 'var(--color-surface-3)';
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
