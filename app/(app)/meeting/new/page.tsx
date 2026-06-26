import type { Metadata } from 'next';
import TranscriptUploader from '@/components/meeting/TranscriptUploader';

export const metadata: Metadata = {
  title: 'New Meeting',
};

export default function NewMeetingPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          Analyse a meeting
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
          Paste your transcript or upload a .txt / .vtt file. Our AI will extract
          summaries, decisions, and action items in seconds.
        </p>
      </div>
      <TranscriptUploader />
    </div>
  );
}
