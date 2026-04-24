import type { TransactionCategory, TierName } from '@/types';

// Base points per £1 spent (amount is in pence, so divide by 100)
const BASE_RATES: Record<TransactionCategory, number> = {
  groceries: 1,
  dining: 2,
  travel: 3,
  utilities: 1,
  entertainment: 2,
  shopping: 1,
  other: 1,
};

const TIER_MULTIPLIERS: Record<TierName, number> = {
  bronze: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 2.0,
};

/**
 * Calculate points for a transaction.
 * @param amountPence - transaction amount in pence
 * @param category    - merchant category
 * @param tier        - current user tier
 * @returns integer points earned (floor)
 */
export function calculatePoints(
  amountPence: number,
  category: TransactionCategory,
  tier: TierName
): number {
  if (amountPence <= 0) return 0;
  const pounds = amountPence / 100;
  const base = BASE_RATES[category] ?? BASE_RATES.other;
  const multiplier = TIER_MULTIPLIERS[tier];
  return Math.floor(pounds * base * multiplier);
}

export { BASE_RATES, TIER_MULTIPLIERS };
