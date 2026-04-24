'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { householdConverter } from '@/lib/firebase/converters';
import type { Household } from '@/types';

interface UseHouseholdResult {
  household:   Household | null;
  loading:     boolean;
  error:       Error | null;
  /** Call to create a household for this user (first login) */
  createHousehold: (token: string) => Promise<void>;
  /** Call to join a household by invite code */
  joinHousehold:   (token: string, code: string) => Promise<{ name: string }>;
}

export function useHousehold(householdId: string | null | undefined): UseHouseholdResult {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'households', householdId).withConverter(householdConverter);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setHousehold(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [householdId]);

  const createHousehold = useCallback(async (token: string): Promise<void> => {
    const res = await fetch('/api/household/create', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? 'Failed to create household');
    }
  }, []);

  const joinHousehold = useCallback(
    async (token: string, code: string): Promise<{ name: string }> => {
      const res = await fetch('/api/household/join', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) throw new Error(body.error ?? 'Failed to join household');
      return { name: body.name ?? '' };
    },
    [],
  );

  return { household, loading, error, createHousehold, joinHousehold };
}
