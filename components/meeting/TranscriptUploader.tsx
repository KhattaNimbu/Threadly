'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const SAMPLE_TRANSCRIPT = `Priya: Okay let's get started. Main thing today is locking the Q3 roadmap.
Alex: Before we do that - the analytics dashboard. Are we still doing it in Q3?
Priya: We're moving it to Q4. That's decided. Mobile app rewrite is the Q3 priority.
Sara: Agreed. I can have wireframes done by Friday if that helps.
Priya: Yes please, Sara, let's make that official. Wireframes by this Friday.
Alex: We also need to post the two engineering job listings this week or we'll miss the recruitment cycle.
Priya: Alex, can you own that? Post them by Monday.
Alex: Done.
Priya: I'll update the roadmap doc and share it with everyone today.
Sara: Should we set up a follow-up to review the wireframes next week?
Priya: Good idea. Let's do Tuesday at 10.`;

export default function TranscriptUploader() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.vtt')) {
      setError('Only .txt and .vtt files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTranscript(content);
      setError('');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleAnalyse = async () => {
    if (!transcript.trim()) {
      setError('Please paste a transcript or upload a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      const data = await res.json() as { meeting_id?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Analysis failed');
      }

      router.push(`/meeting/${data.meeting_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone / textarea */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: dragging
            ? '2px dashed var(--color-purple)'
            : '0.5px solid var(--color-surface-3)',
          borderRadius: '12px',
          background: dragging ? 'var(--color-purple-light)' : 'var(--color-surface)',
          transition: 'all 0.15s ease',
        }}
      >
        <Textarea
          id="transcript-input"
          placeholder="Paste your meeting transcript here...

Or drag and drop a .txt or .vtt file"
          value={transcript}
          onChange={(e) => { setTranscript(e.target.value); setError(''); }}
          style={{
            minHeight: '320px',
            border: 'none',
            background: 'transparent',
            borderRadius: '12px',
          }}
        />
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={handleAnalyse}
          id="analyse-btn"
        >
          {loading ? 'Analysing...' : 'Analyse meeting'}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v8M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Upload file
        </Button>

        {!transcript && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
            disabled={loading}
          >
            Try sample
          </Button>
        )}

        {transcript && !loading && (
          <button
            onClick={() => { setTranscript(''); setError(''); }}
            className="text-sm"
            style={{ color: 'var(--color-ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.vtt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* Character count */}
      {transcript && (
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          {transcript.length.toLocaleString()} characters - ~{Math.ceil(transcript.split(/\s+/).length / 130)} min read
        </p>
      )}

      {/* Error */}
      {error && (
        <Card style={{ borderLeft: '3px solid var(--color-coral-dark)', padding: '12px 16px' }}>
          <p className="text-sm" style={{ color: 'var(--color-coral-dark)' }}>
            {error}
          </p>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3 mt-4">
          <p className="text-sm font-medium" style={{ color: 'var(--color-ink-2)' }}>
            AI is analysing your transcript...
          </p>
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="space-y-2 mt-4">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-10 w-full rounded" />
            <div className="skeleton h-10 w-full rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
