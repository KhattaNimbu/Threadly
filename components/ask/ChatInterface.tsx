'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import type { ChatMessage } from '@/lib/types';

const STARTER_QUESTIONS = [
  'What decisions were made in recent meetings?',
  'Who is responsible for pending tasks?',
  'What topics came up most this month?',
  'Which meetings had follow-up actions?',
];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || streaming) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? 'Request failed');
      }

      const meetingsUsedHeader = res.headers.get('X-Meetings-Used');
      const meetingsUsed: Array<{ id: string; title: string }> = meetingsUsedHeader
        ? JSON.parse(meetingsUsedHeader)
        : [];

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: fullText }
                : msg
            )
          );
        }
      }

      // Update with meeting context
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: fullText,
                meetings_used: meetingsUsed.map((m) => m.title),
              }
            : msg
        )
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Error: ${errMsg}` }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [streaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-interface flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          /* Empty state with starter questions */
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'var(--color-purple-light)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 2H3a1 1 0 00-1 1v12a1 1 0 001 1h4l4 4 4-4h6a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="var(--color-purple)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 10a.5.5 0 100-1 .5.5 0 000 1zM12 10a.5.5 0 100-1 .5.5 0 000 1zM16 10a.5.5 0 100-1 .5.5 0 000 1z" fill="var(--color-purple)" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
              Ask about your meetings
            </h2>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--color-ink-3)' }}>
              Ask anything about past meetings, decisions, or action items.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-150"
                  style={{
                    border: '0.5px solid var(--color-surface-3)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-ink-2)',
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-purple)';
                    e.currentTarget.style.background = 'var(--color-purple-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-surface-3)';
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isStreaming = isLast && streaming && msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${isStreaming ? 'streaming-cursor' : ''}`}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: msg.role === 'user' ? 'var(--color-user-bg)' : 'var(--color-card-bg)',
                    color: msg.role === 'user' ? 'var(--color-user-text)' : 'var(--color-ink)',
                    border: '1px solid var(--color-surface-3)',
                    fontSize: 'var(--chat-font-size)',
                    lineHeight: '1.6',
                  }}
                >
                  {msg.content || (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Spinner size="sm" />
                      <span style={{ color: 'var(--color-ink-3)', fontSize: '13px' }}>
                        Thinking...
                      </span>
                    </div>
                  )}

                  {/* Meetings used context */}
                  {msg.meetings_used && msg.meetings_used.length > 0 && (
                    <p
                      className="mt-2"
                      style={{ color: 'var(--color-ink-3)', borderTop: '0.5px solid var(--color-surface-2)', paddingTop: '8px', fontSize: '13px' }}
                    >
                      Based on: {msg.meetings_used.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 items-end pt-4"
        style={{ borderTop: '0.5px solid var(--color-surface-3)' }}
      >
        <textarea
          ref={inputRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your meetings... (Enter to send)"
          disabled={streaming}
          rows={1}
          className="flex-1 resize-none outline-none text-sm"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '0.5px solid var(--color-surface-3)',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            maxHeight: '120px',
            minHeight: '42px',
            lineHeight: '1.5',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '0.5px solid var(--color-purple)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-purple-light)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '0.5px solid var(--color-surface-3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={!input.trim() || streaming}
          loading={streaming}
          id="send-message-btn"
        >
          {streaming ? '' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
