import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuests } from './useQuests';
import type { Quest } from '@/types';

const { mockOnSnapshot } = vi.hoisted(() => ({ mockOnSnapshot: vi.fn() }));

vi.mock('@/lib/firebase/client', () => ({ db: {} }));
vi.mock('@/lib/firebase/converters', () => ({ questConverter: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ withConverter: vi.fn(() => ({})) })),
  query:      vi.fn(() => ({})),
  where:      vi.fn(() => ({})),
  orderBy:    vi.fn(() => ({})),
  onSnapshot: mockOnSnapshot,
}));

function makeQuest(overrides: Partial<Quest>): Quest {
  return {
    id:            'q-1',
    userId:        'u-1',
    title:         'Test Quest',
    description:   'A test quest',
    category:      'groceries',
    targetAmount:  100,
    currentAmount: 0,
    pointsReward:  50,
    status:        'active',
    createdAt:     Date.now(),
    expiresAt:     Date.now() + 86_400_000 * 7,
    ...overrides,
  };
}

describe('useQuests', () => {
  beforeEach(() => {
    mockOnSnapshot.mockReset();
  });

  it('splits snapshot docs into active and completed arrays', async () => {
    const activeQuest    = makeQuest({ id: 'q-active',    status: 'active'    });
    const completedQuest = makeQuest({ id: 'q-completed', status: 'completed' });

    mockOnSnapshot.mockImplementation((_q: unknown, onNext: (snap: unknown) => void) => {
      onNext({
        docs: [
          { data: () => activeQuest    },
          { data: () => completedQuest },
        ],
      });
      return () => {};
    });

    const { result } = renderHook(() => useQuests('u-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.active).toHaveLength(1);
    expect(result.current.active[0].id).toBe('q-active');

    expect(result.current.completed).toHaveLength(1);
    expect(result.current.completed[0].id).toBe('q-completed');
  });

  it('returns empty arrays and loading=false when uid is undefined', async () => {
    const { result } = renderHook(() => useQuests(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.active).toHaveLength(0);
    expect(result.current.completed).toHaveLength(0);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('sets loading=false on snapshot error', async () => {
    mockOnSnapshot.mockImplementation(
      (_q: unknown, _onNext: unknown, onError: () => void) => {
        onError();
        return () => {};
      },
    );

    const { result } = renderHook(() => useQuests('u-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.active).toHaveLength(0);
    expect(result.current.completed).toHaveLength(0);
  });
});
