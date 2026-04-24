import { describe, it, expect } from 'vitest';
import { generateInviteCode } from './inviteCode';

describe('generateInviteCode', () => {
  it('returns exactly 6 characters', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  it('only contains alphanumeric uppercase characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(/^[A-Z0-9]+$/.test(generateInviteCode())).toBe(true);
    }
  });

  it('does not contain ambiguous characters (I, O, 0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateInviteCode()).not.toMatch(/[IO01]/);
    }
  });

  it('generates unique codes across many calls', () => {
    const codes = new Set(Array.from({ length: 200 }, generateInviteCode));
    // With 32^6 ≈ 1 billion possibilities, 200 calls should be essentially all unique
    expect(codes.size).toBeGreaterThan(190);
  });

  it('each character is drawn from the allowed set', () => {
    const allowed = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    for (let i = 0; i < 50; i++) {
      for (const ch of generateInviteCode()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });
});
