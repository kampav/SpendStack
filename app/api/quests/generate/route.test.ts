import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
      doc: vi.fn().mockReturnValue({ id: 'mock-quest-id' }),
    }),
    batch: vi.fn().mockReturnValue({
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/lib/anthropic/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { title: 'Grocery Run', description: 'Spend £50 at supermarkets', category: 'groceries', targetAmount: 5000, pointsReward: 100 },
              { title: 'Dine Out', description: 'Eat at a restaurant', category: 'dining', targetAmount: 3000, pointsReward: 150 },
              { title: 'Travel Smart', description: 'Book a train ticket', category: 'travel', targetAmount: 4000, pointsReward: 200 },
            ]),
          },
        ],
      }),
    },
  },
}));

describe('POST /api/quests/generate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when Authorization header is missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/quests/generate', { method: 'POST' });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('returns a JSON array of quests for an authenticated request', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/quests/generate', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('title');
    expect(body[0]).toHaveProperty('pointsReward');
  });
});
