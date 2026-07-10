'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import type { ExportDestination, ExportFormat, ExportResponse } from '@/lib/types';

interface ExportButtonProps {
  meetingId: string;
  defaultRecipientEmail?: string;
}

const formats: Array<{ key: ExportFormat; label: string }> = [
  { key: 'notion', label: 'Copy for Notion' },
  { key: 'slack', label: 'Copy for Slack' },
  { key: 'email', label: 'Copy for Email' },
];

const emailFormats: Array<{ key: ExportFormat; label: string }> = [
  { key: 'email', label: 'Email style' },
  { key: 'slack', label: 'Slack style' },
  { key: 'notion', label: 'Notion style' },
];

export default function ExportButton({ meetingId, defaultRecipientEmail = '' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<ExportFormat | null>(null);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [emailFormat, setEmailFormat] = useState<ExportFormat>('email');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [manualCopyContent, setManualCopyContent] = useState<string | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null);

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn('Clipboard API copy failed, falling back to execCommand:', error);
      }
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', 'true');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.left = '-9999px';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const succeeded = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!succeeded) {
      throw new Error('Clipboard access is blocked in this browser.');
    }
  };

  useEffect(() => {
    if (!manualCopyContent || !manualCopyRef.current) {
      return;
    }

    manualCopyRef.current.focus();
    manualCopyRef.current.select();
    manualCopyRef.current.setSelectionRange(0, manualCopyContent.length);
  }, [manualCopyContent]);

  const handleExport = async (
    format: ExportFormat,
    destination: ExportDestination,
    recipientEmailArg?: string
  ) => {
    const loadingKey = destination === 'clipboard' ? `copy-${format}` : 'send-email';
    setLoading(loadingKey);
    setOpen(false);
    setFeedback(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          format,
          destination,
          recipient_email: recipientEmailArg,
        }),
      });

      const data = await res.json() as ExportResponse & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Export failed');
      }

      if (destination === 'clipboard') {
        if (!data.content) {
          throw new Error('Export content missing');
        }

        try {
          await copyTextToClipboard(data.content);
        } catch (copyError) {
          setManualCopyContent(data.content);
          setFeedback({
            type: 'error',
            message: 'Clipboard access is blocked here. Press Ctrl+C to copy from the panel below.',
          });
          return;
        }

        setCopied(format);
        setFeedback({ type: 'success', message: `${formats.find((item) => item.key === format)?.label ?? 'Export'} copied to clipboard.` });
        setTimeout(() => setCopied(null), 3000);
        return;
      }

      setEmailPanelOpen(false);
      setFeedback({
        type: 'success',
        message: `Sent to ${data.delivered_to ?? recipientEmailArg}.`,
      });
    } catch (err) {
      console.error('Export error:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Export failed',
      });
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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1.5 z-20 rounded-xl py-1 min-w-[160px]"
            style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-surface-3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {formats.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleExport(key, 'clipboard')}
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
            <div style={{ height: '1px', background: 'var(--color-surface-3)', margin: '4px 0' }} />
            <button
              onClick={() => {
                setOpen(false);
                setEmailPanelOpen((current) => !current);
                setFeedback(null);
              }}
              id="export-email-send-btn"
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
              Send by Email
            </button>
          </div>
        </>
      )}

      {emailPanelOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-20 w-[320px] rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-surface-3)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Send by Email
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-3)' }}>
              We&apos;ll send this meeting export to the address below.
            </p>
          </div>

          <label className="block text-xs font-medium" style={{ color: 'var(--color-ink-2)' }}>
            Recipient email
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                border: '0.5px solid var(--color-surface-3)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
              }}
            />
          </label>

          <label className="block text-xs font-medium" style={{ color: 'var(--color-ink-2)' }}>
            Format
            <select
              value={emailFormat}
              onChange={(e) => setEmailFormat(e.target.value as ExportFormat)}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                border: '0.5px solid var(--color-surface-3)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
              }}
            >
              {emailFormats.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEmailPanelOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              loading={loading === 'send-email'}
              onClick={() => handleExport(emailFormat, 'email', recipientEmail.trim())}
              disabled={!recipientEmail.trim()}
            >
              Send email
            </Button>
          </div>
        </div>
      )}

      {feedback && (
        <p
          className="absolute right-0 top-full mt-2 w-[320px] text-xs rounded-xl px-3 py-2"
          style={{
            color: feedback.type === 'success' ? 'var(--color-ink)' : 'var(--color-coral-dark)',
            background: feedback.type === 'success' ? 'var(--color-surface-2)' : 'var(--color-coral-light)',
            border: feedback.type === 'success'
              ? '0.5px solid var(--color-surface-3)'
              : '0.5px solid #f0c4b8',
          }}
        >
          {feedback.message}
        </p>
      )}

      {manualCopyContent && (
        <div
          className="absolute right-0 top-full mt-16 z-20 w-[360px] rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-surface-3)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                Manual Copy
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-3)' }}>
                Clipboard permission is blocked. The export text is selected below, so you can press Ctrl+C.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualCopyContent(null)}
            >
              Close
            </Button>
          </div>

          <textarea
            ref={manualCopyRef}
            value={manualCopyContent}
            readOnly
            className="w-full rounded-xl px-3 py-3 text-xs outline-none"
            style={{
              minHeight: '220px',
              border: '0.5px solid var(--color-surface-3)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
              resize: 'vertical',
            }}
          />
        </div>
      )}
    </div>
  );
}
