import { describe, it, expect } from 'vitest';
import { advanceStreak, getMilestone, isStreakAlive } from './engine';
import type { Streak } from '@/types';

const baseStreak: Streak = {
  uid: 'user-1',
  currentDays: 0,
  longestDays: 0,
  lastActivityDate: '',
  activeDates: [],
};

describe('advanceStreak', () => {
  it('starts a streak on first activity', () => {
    const result = advanceStreak(baseStreak, '2026-04-01');
    expect(result.currentDays).toBe(1);
    expect(result.lastActivityDate).toBe('2026-04-01');
  });

  it('increments when consecutive day', () => {
    const streak: Streak = { ...baseStreak, currentDays: 3, lastActivityDate: '2026-04-01', longestDays: 3 };
    const result = advanceStreak(streak, '2026-04-02');
    expect(result.currentDays).toBe(4);
  });

  it('resets to 1 when a day is missed', () => {
    const streak: Streak = { ...baseStreak, currentDays: 5, lastActivityDate: '2026-04-01', longestDays: 5 };
    const result = advanceStreak(streak, '2026-04-03');
    expect(result.currentDays).toBe(1);
  });

  it('is a no-op when same day is recorded twice', () => {
    const streak: Streak = { ...baseStreak, currentDays: 3, lastActivityDate: '2026-04-01', longestDays: 3 };
    const result = advanceStreak(streak, '2026-04-01');
    expect(result).toBe(streak);
  });

  it('updates longestDays when new record is set', () => {
    const streak: Streak = { ...baseStreak, currentDays: 6, lastActivityDate: '2026-04-01', longestDays: 6 };
    const result = advanceStreak(streak, '2026-04-02');
    expect(result.longestDays).toBe(7);
  });

  it('does not decrease longestDays on reset', () => {
    const streak: Streak = { ...baseStreak, currentDays: 3, lastActivityDate: '2026-04-01', longestDays: 10 };
    const result = advanceStreak(streak, '2026-04-05');
    expect(result.longestDays).toBe(10);
  });

  it('keeps only last 30 activeDates', () => {
    const dates = Array.from({ length: 30 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
    const streak: Streak = { ...baseStreak, currentDays: 30, lastActivityDate: '2026-01-30', longestDays: 30, activeDates: dates };
    const result = advanceStreak(streak, '2026-01-31');
    expect(result.activeDates).toHaveLength(30);
    expect(result.activeDates[29]).toBe('2026-01-31');
  });
});

describe('getMilestone', () => {
  it('returns milestone at 7 days', () => {
    const m = getMilestone(7);
    expect(m?.days).toBe(7);
    expect(m?.reward).toBeGreaterThan(0);
  });

  it('returns null for non-milestone day', () => {
    expect(getMilestone(8)).toBeNull();
  });
});

describe('isStreakAlive', () => {
  it('returns true when last activity was today', () => {
    const streak: Streak = { ...baseStreak, lastActivityDate: '2026-04-24' };
    expect(isStreakAlive(streak, '2026-04-24')).toBe(true);
  });

  it('returns true when last activity was yesterday', () => {
    const streak: Streak = { ...baseStreak, lastActivityDate: '2026-04-23' };
    expect(isStreakAlive(streak, '2026-04-24')).toBe(true);
  });

  it('returns false when streak is broken', () => {
    const streak: Streak = { ...baseStreak, lastActivityDate: '2026-04-20' };
    expect(isStreakAlive(streak, '2026-04-24')).toBe(false);
  });
});
