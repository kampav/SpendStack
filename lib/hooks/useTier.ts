'use client';

import { useMemo } from 'react';
import { resolveTierProgress } from '@/lib/tier/resolver';
import type { TierProgress } from '@/types';

export function useTier(totalPoints: number): TierProgress {
  return useMemo(() => resolveTierProgress(totalPoints), [totalPoints]);
}
