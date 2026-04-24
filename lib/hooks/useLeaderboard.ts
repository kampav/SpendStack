'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { householdMemberConverter } from '@/lib/firebase/converters';
import type { HouseholdMember } from '@/types';

export function useLeaderboard(householdId: string | undefined) {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'households', householdId, 'members').withConverter(
        householdMemberConverter
      ),
      orderBy('totalPoints', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMembers(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [householdId]);

  return { members, loading, error };
}
