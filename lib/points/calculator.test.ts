import { describe, it, expect } from 'vitest';
import { calculatePoints } from './calculator';

describe('calculatePoints', () => {
  it('returns 0 for zero amount', () => {
    expect(calculatePoints(0, 'groceries', 'bronze')).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(calculatePoints(-500, 'groceries', 'bronze')).toBe(0);
  });

  it('calculates 1pt/£1 for groceries at bronze', () => {
    expect(calculatePoints(1000, 'groceries', 'bronze')).toBe(10);
  });

  it('calculates 2pt/£1 for dining at bronze', () => {
    expect(calculatePoints(500, 'dining', 'bronze')).toBe(10);
  });

  it('calculates 3pt/£1 for travel at bronze', () => {
    expect(calculatePoints(1000, 'travel', 'bronze')).toBe(30);
  });

  it('applies silver multiplier (1.25x)', () => {
    expect(calculatePoints(1000, 'groceries', 'silver')).toBe(12);
  });

  it('applies gold multiplier (1.5x)', () => {
    expect(calculatePoints(1000, 'dining', 'gold')).toBe(30);
  });

  it('applies platinum multiplier (2.0x)', () => {
    expect(calculatePoints(1000, 'travel', 'platinum')).toBe(60);
  });

  it('floors the result (no fractional points)', () => {
    // £0.99 groceries silver = 0.99 × 1 × 1.25 = 1.2375 → 1
    expect(calculatePoints(99, 'groceries', 'silver')).toBe(1);
  });
});
