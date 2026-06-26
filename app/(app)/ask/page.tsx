import type { Metadata } from 'next';
import ChatInterface from '@/components/ask/ChatInterface';

export const metadata: Metadata = {
  title: 'Ask AI',
};

export default function AskPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          Ask AI
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
          Chat with your meeting history to quickly find answers, decisions, and tasks.
        </p>
      </div>
      
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--color-surface-3)', background: 'var(--color-surface)' }}>
        <div className="p-4 h-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
