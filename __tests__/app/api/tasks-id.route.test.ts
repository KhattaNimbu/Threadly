/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockAuth = jest.fn();
const mockCreateServerSupabase = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => mockCreateServerSupabase(),
}));

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('requires a boolean completed field', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });

    const { PATCH } = await import('@/app/api/tasks/[id]/route');
    const req = new NextRequest('http://localhost/api/tasks/task_1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: 'yes' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'task_1' }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'completed field must be a boolean',
    });
  });

  it('updates a task for the authenticated owner', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });

    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'task_1',
        completed: true,
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eqUser = jest.fn(() => ({ select }));
    const eqId = jest.fn(() => ({ eq: eqUser }));
    const update = jest.fn(() => ({ eq: eqId }));

    mockCreateServerSupabase.mockReturnValue({
      from: () => ({ update }),
    });

    const { PATCH } = await import('@/app/api/tasks/[id]/route');
    const req = new NextRequest('http://localhost/api/tasks/task_1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'task_1' }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      task: {
        id: 'task_1',
        completed: true,
      },
    });
  });
});
