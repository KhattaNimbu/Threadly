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
      className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      style={{
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
