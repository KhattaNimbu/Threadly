/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockAuth = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockFindRelevantMeetingsForQuestion = jest.fn();
const mockStreamAskHistory = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

jest.mock('@/lib/meeting-search', () => ({
  findRelevantMeetingsForQuestion: (...args: unknown[]) => mockFindRelevantMeetingsForQuestion(...args),
}));

jest.mock('@/lib/gemini', () => ({
  streamAskHistory: (...args: unknown[]) => mockStreamAskHistory(...args),
}));

describe('POST /api/ask', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 400 when question is blank', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });

    const { POST } = await import('@/app/api/ask/route');
    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question: '   ' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Question is required' });
  });

  it('streams an answer using semantic meeting retrieval', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCheckRateLimit.mockResolvedValue(true);
    mockFindRelevantMeetingsForQuestion.mockResolvedValue([
      {
        id: 'meeting_1',
        user_id: 'user_123',
        title: 'Roadmap Review',
        raw_transcript: null,
        summary: 'Summary',
        decisions: [],
        topics: [],
        participants: [],
        sentiment: 'productive',
        follow_up_needed: false,
        duration_estimate: null,
        met_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        action_items: [],
      },
    ]);
    mockStreamAskHistory.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('semantic answer'));
          controller.close();
        },
      })
    );

    const { POST } = await import('@/app/api/ask/route');
    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question: 'What did we decide about the roadmap?' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mockFindRelevantMeetingsForQuestion).toHaveBeenCalledWith({
      userId: 'user_123',
      question: 'What did we decide about the roadmap?',
    });
    expect(response.headers.get('X-Meetings-Used')).toContain('Roadmap Review');
    await expect(response.text()).resolves.toBe('semantic answer');
  });
});
