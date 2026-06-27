/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockAuth = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockFormatMeetingExport = jest.fn();
const mockCreateServerSupabase = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

jest.mock('@/lib/gemini', () => ({
  formatMeetingExport: (...args: unknown[]) => mockFormatMeetingExport(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => mockCreateServerSupabase(),
}));

describe('POST /api/export', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('validates the requested export format', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });

    const { POST } = await import('@/app/api/export/route');
    const req = new NextRequest('http://localhost/api/export', {
      method: 'POST',
      body: JSON.stringify({ meeting_id: 'meeting_1', format: 'pdf' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'format must be one of: notion, slack, email',
    });
  });

  it('returns generated export content for owned meetings', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCheckRateLimit.mockResolvedValue(true);
    mockFormatMeetingExport.mockResolvedValue('formatted export');

    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'meeting_1',
        user_id: 'user_123',
        title: 'Sprint Review',
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
      error: null,
    });
    const eqUser = jest.fn(() => ({ single }));
    const eqId = jest.fn(() => ({ eq: eqUser }));
    const select = jest.fn(() => ({ eq: eqId }));

    mockCreateServerSupabase.mockReturnValue({
      from: () => ({ select }),
    });

    const { POST } = await import('@/app/api/export/route');
    const req = new NextRequest('http://localhost/api/export', {
      method: 'POST',
      body: JSON.stringify({ meeting_id: 'meeting_1', format: 'slack' }),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ content: 'formatted export' });
  });
});
