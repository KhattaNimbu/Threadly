/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockAuth = jest.fn();
const mockAnalyseMeeting = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockSyncAuthenticatedUser = jest.fn();
const mockGenerateMeetingSearchEmbedding = jest.fn();
const mockCreateServerSupabase = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/gemini', () => ({
  analyseMeeting: (...args: unknown[]) => mockAnalyseMeeting(...args),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

jest.mock('@/lib/user-sync', () => ({
  syncAuthenticatedUser: (...args: unknown[]) => mockSyncAuthenticatedUser(...args),
}));

jest.mock('@/lib/meeting-search', () => ({
  generateMeetingSearchEmbedding: (...args: unknown[]) => mockGenerateMeetingSearchEmbedding(...args),
  toVectorLiteral: (embedding: number[]) => `[${embedding.join(',')}]`,
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => mockCreateServerSupabase(),
}));

describe('POST /api/process-meeting', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 401 for anonymous requests', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import('@/app/api/process-meeting/route');
    const req = new NextRequest('http://localhost/api/process-meeting', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'hello' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('creates a meeting, action items, and embedding for valid requests', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCheckRateLimit.mockResolvedValue(true);
    mockSyncAuthenticatedUser.mockResolvedValue(undefined);
    mockAnalyseMeeting.mockResolvedValue({
      title: 'Planning Sync',
      summary: 'Planned the sprint.',
      decisions: ['Start Monday'],
      action_items: [
        { title: 'Write ticket', assignee: 'Ava', due_date: '2026-07-01', priority: 'high' },
      ],
      participants: ['Ava'],
      topics: ['Sprint'],
      duration_estimate: '30 minutes',
      sentiment: 'productive',
      follow_up_meeting_needed: false,
    });
    mockGenerateMeetingSearchEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

    const meetingsInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 'meeting_1' },
      error: null,
    });
    const meetingsInsertSelect = jest.fn(() => ({ single: meetingsInsertSingle }));
    const meetingsInsert = jest.fn(() => ({ select: meetingsInsertSelect }));

    const actionItemsInsert = jest.fn().mockResolvedValue({ error: null });

    const meetingsUpdateEqUser = jest.fn().mockResolvedValue({ error: null });
    const meetingsUpdateEqId = jest.fn(() => ({ eq: meetingsUpdateEqUser }));
    const meetingsUpdate = jest.fn(() => ({ eq: meetingsUpdateEqId }));

    mockCreateServerSupabase.mockReturnValue({
      from: (table: string) => {
        if (table === 'meetings') {
          return {
            insert: meetingsInsert,
            update: meetingsUpdate,
          };
        }

        if (table === 'action_items') {
          return {
            insert: actionItemsInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { POST } = await import('@/app/api/process-meeting/route');
    const req = new NextRequest('http://localhost/api/process-meeting', {
      method: 'POST',
      body: JSON.stringify({ transcript: '  Transcript body  ' }),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockSyncAuthenticatedUser).toHaveBeenCalledWith('user_123');
    expect(mockGenerateMeetingSearchEmbedding).toHaveBeenCalled();
    expect(meetingsUpdate).toHaveBeenCalledWith({ content_embedding: '[0.1,0.2,0.3]' });
    expect(json.meeting_id).toBe('meeting_1');
    expect(json.analysis.title).toBe('Planning Sync');
  });
});
