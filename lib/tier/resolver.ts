import type { Tier, TierName, TierProgress } from '@/types';

export const TIERS: Tier[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    multiplier: 1.0,
    color: '#CD7F32',
    badgeEmoji: '🥉',
  },
  {
    id: 'silver',
    label: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    multiplier: 1.25,
    color: '#A8A9AD',
    badgeEmoji: '🥈',
  },
  {
    id: 'gold',
    label: 'Gold',
    minPoints: 5000,
    maxPoints: 14999,
    multiplier: 1.5,
    color: '#D4A017',
    badgeEmoji: '🥇',
  },
  {
    id: 'platinum',
    label: 'Platinum',
    minPoints: 15000,
    maxPoints: null,
    multiplier: 2.0,
    color: '#E5E4E2',
    badgeEmoji: '💎',
  },
];

export function resolveTier(totalPoints: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalPoints >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

export function resolveTierProgress(totalPoints: number): TierProgress {
  const current = resolveTier(totalPoints);
  const nextIndex = TIERS.findIndex((t) => t.id === current.id) + 1;
  const next = nextIndex < TIERS.length ? TIERS[nextIndex] : null;

  const pointsInTier = totalPoints - current.minPoints;
  const tierRange = next ? next.minPoints - current.minPoints : null;
  const pointsNeeded = next ? next.minPoints - totalPoints : null;
  const progressPercent =
    tierRange !== null ? Math.min(100, (pointsInTier / tierRange) * 100) : 100;

  return { current, next, pointsInTier, pointsNeeded, progressPercent };
}

export function getTierByName(name: TierName): Tier {
  return TIERS.find((t) => t.id === name) ?? TIERS[0];
}
