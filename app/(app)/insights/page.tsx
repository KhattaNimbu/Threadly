'use client';

import { useState, useEffect } from 'react';

import InsightCard from '@/components/insights/InsightCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { PatternInsight } from '@/lib/types';

function InsightSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="skeleton w-9 h-9 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/insights');
      const data = await res.json() as { insights?: PatternInsight[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to load insights');
      }

      setInsights(data.insights ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Insights
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
            AI-detected patterns across your meeting history
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          loading={loading}
          id="refresh-insights-btn"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M2 6.5a4.5 4.5 0 014.5-4.5A4.5 4.5 0 0111 6.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path d="M11 4V2M11 2h-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M11 6.5a4.5 4.5 0 01-4.5 4.5A4.5 4.5 0 012 6.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path d="M2 9v2M2 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      ) : error ? (
        <div
          className="card"
          style={{ borderLeft: '3px solid var(--color-coral-dark)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-coral-dark)' }}>
            {error}
          </p>
          <button
            onClick={fetchInsights}
            className="text-sm mt-2"
            style={{ color: 'var(--color-purple)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          title="No insights yet"
          description="Add at least 2 meetings to unlock cross-meeting pattern analysis."
          action={{ label: 'Analyse a meeting', href: '/meeting/new' }}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 13l4-5 4 3 4-7 4 3" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 19h20" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
