import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Admin SDK mock ────────────────────────────────────────────────────────────

const mockBatchUpdate = vi.fn();
const mockBatchSet    = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

const mockMemberDoc = vi.fn();
const mockLedgerDoc = vi.fn().mockReturnValue({ id: 'ledger-id' });
const mockRedemDoc  = vi.fn().mockReturnValue({ id: 'redemption-id' });

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-123' }),
  },
  adminDb: {
    collection: vi.fn((name: string) => {
      if (name === 'households') {
        return {
          doc: vi.fn().mockReturnValue({
            collection: vi.fn().mockReturnValue({
              doc: mockMemberDoc,
            }),
          }),
        };
      }
      if (name === 'pointsLedger') return { doc: mockLedgerDoc };
      if (name === 'redemptions')  return { doc: mockRedemDoc  };
      return {};
    }),
    batch: vi.fn().mockReturnValue({
      update: mockBatchUpdate,
      set:    mockBatchSet,
      commit: mockBatchCommit,
    }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: object, token = 'Bearer valid') {
  return new Request('http://localhost/api/store/redeem', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  token,
    },
    body: JSON.stringify(body),
  });
}

function memberSnap(totalPoints: number) {
  return {
    exists: true,
    data:   () => ({ totalPoints }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/store/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/store/redeem', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is missing required fields', async () => {
    const { POST } = await import('./route');
    mockMemberDoc.mockReturnValue({ get: vi.fn().mockResolvedValue(memberSnap(1000)) });

    const req = makeRequest({ itemId: 'cat-1' }); // missing itemTitle, pointsCost, householdId
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 with insufficient points message when balance is too low', async () => {
    const { POST } = await import('./route');
    // Member has 300 pts, item costs 500
    mockMemberDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue(memberSnap(300)),
    });

    const req = makeRequest({
      itemId:      'cat-1',
      itemTitle:   '£5 Cashback',
      pointsCost:  500,
      householdId: 'demo-household',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/insufficient/i);
  });

  it('commits batch and returns success + newBalance on sufficient points', async () => {
    const { POST } = await import('./route');
    // Member has 1000 pts, item costs 500 → newBalance 500
    mockMemberDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue(memberSnap(1000)),
    });

    const req = makeRequest({
      itemId:      'cat-1',
      itemTitle:   '£5 Cashback',
      pointsCost:  500,
      householdId: 'demo-household',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.newBalance).toBe(500);

    // Batch was committed exactly once
    expect(mockBatchCommit).toHaveBeenCalledOnce();

    // Ledger and redemption docs were written
    expect(mockBatchSet).toHaveBeenCalledTimes(2);

    // Verify redemption status is 'fulfilled' (not 'pending')
    const redemptionCall = mockBatchSet.mock.calls.find(
      ([, data]: [unknown, Record<string, unknown>]) => data.status !== undefined,
    );
    expect(redemptionCall?.[1]).toMatchObject({
      status:     'fulfilled',
      pointsCost: 500,
    });

    // Verify ledger delta is negative
    const ledgerCall = mockBatchSet.mock.calls.find(
      ([, data]: [unknown, Record<string, unknown>]) => data.delta !== undefined,
    );
    expect(ledgerCall?.[1]).toMatchObject({
      delta:        -500,
      reason:       'redemption',
      balanceAfter: 500,
    });
  });
});
