import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  },
}));

function makeStream(chunks: string[]) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < chunks.length) {
            return { value: { type: 'content_block_delta', delta: { type: 'text_delta', text: chunks[i++] } }, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

vi.mock('@/lib/anthropic/client', () => ({
  anthropic: {
    messages: {
      stream: vi.fn().mockReturnValue(makeStream(['Hello', ' world'])),
    },
  },
}));

describe('POST /api/coach/chat', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when Authorization header is missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/coach/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('returns a streaming text/plain response for an authenticated request', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/coach/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    const res = await POST(req as never);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(res.body).toBeTruthy();
  });
});
