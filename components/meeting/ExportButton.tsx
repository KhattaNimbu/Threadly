'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { ExportFormat } from '@/lib/types';

interface ExportButtonProps {
  meetingId: string;
}

const formats: Array<{ key: ExportFormat; label: string }> = [
  { key: 'notion', label: 'Copy for Notion' },
  { key: 'slack', label: 'Copy for Slack' },
  { key: 'email', label: 'Copy for Email' },
];

export default function ExportButton({ meetingId }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [copied, setCopied] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    setOpen(false);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meetingId, format }),
      });

      const data = await res.json() as { content?: string; error?: string };

      if (!res.ok || !data.content) {
        throw new Error(data.error ?? 'Export failed');
      }

      await navigator.clipboard.writeText(data.content);
      setCopied(format);
      setTimeout(() => setCopied(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        loading={loading !== null}
        onClick={() => setOpen(!open)}
        id="export-btn"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 3H3a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="5" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Export
          </>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1.5 z-20 rounded-xl py-1 min-w-[160px]"
            style={{
              background: '#ffffff',
              border: '0.5px solid var(--color-surface-3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {formats.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleExport(key)}
                id={`export-${key}-btn`}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
