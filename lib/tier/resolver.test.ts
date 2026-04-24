import { describe, it, expect } from 'vitest';
import { resolveTier, resolveTierProgress } from './resolver';

describe('resolveTier', () => {
  it('returns bronze at 0 points', () => {
    expect(resolveTier(0).id).toBe('bronze');
  });

  it('returns bronze at 999 points', () => {
    expect(resolveTier(999).id).toBe('bronze');
  });

  it('returns silver at 1000 points', () => {
    expect(resolveTier(1000).id).toBe('silver');
  });

  it('returns silver at 4999 points', () => {
    expect(resolveTier(4999).id).toBe('silver');
  });

  it('returns gold at 5000 points', () => {
    expect(resolveTier(5000).id).toBe('gold');
  });

  it('returns gold at 14999 points', () => {
    expect(resolveTier(14999).id).toBe('gold');
  });

  it('returns platinum at 15000 points', () => {
    expect(resolveTier(15000).id).toBe('platinum');
  });

  it('returns platinum at very high points', () => {
    expect(resolveTier(1_000_000).id).toBe('platinum');
  });
});

describe('resolveTierProgress', () => {
  it('calculates 0% progress at bronze floor', () => {
    const p = resolveTierProgress(0);
    expect(p.current.id).toBe('bronze');
    expect(p.progressPercent).toBe(0);
    expect(p.pointsNeeded).toBe(1000);
  });

  it('calculates 50% progress mid-bronze', () => {
    const p = resolveTierProgress(500);
    expect(p.progressPercent).toBeCloseTo(50);
  });

  it('returns 100% and no next tier for platinum', () => {
    const p = resolveTierProgress(20000);
    expect(p.current.id).toBe('platinum');
    expect(p.next).toBeNull();
    expect(p.progressPercent).toBe(100);
    expect(p.pointsNeeded).toBeNull();
  });

  it('caps progress at 100%', () => {
    const p = resolveTierProgress(999);
    expect(p.progressPercent).toBeLessThanOrEqual(100);
  });
});
