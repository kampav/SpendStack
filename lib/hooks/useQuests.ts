'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { questConverter } from '@/lib/firebase/converters';
import type { Quest } from '@/types';

export interface UseQuestsResult {
  active:    Quest[];
  completed: Quest[];
  loading:   boolean;
}

/**
 * Subscribes in real-time to the authenticated user's quests.
 *
 * Filters Firestore to status in ['active', 'completed'] so expired quests are
 * never fetched. Splits the result into two pre-sorted arrays ready for the UI.
 */
export function useQuests(uid: string | undefined): UseQuestsResult {
  const [active,    setActive]    = useState<Quest[]>([]);
  const [completed, setCompleted] = useState<Quest[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Composite query: userId match + status filter + newest-first ordering.
    // Requires a Firestore composite index on (userId ASC, status ASC, createdAt DESC).
    // Index URL is printed in the browser console on first run if missing.
    const q = query(
      collection(db, 'quests').withConverter(questConverter),
      where('userId',  '==',  uid),
      where('status',  'in',  ['active', 'completed']),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => d.data());
        setActive(all.filter((q) => q.status === 'active'));
        setCompleted(all.filter((q) => q.status === 'completed'));
        setLoading(false);
      },
      () => {
        // On permission / index error: stop loading so page still renders
        setLoading(false);
      },
    );

    return unsub;
  }, [uid]);

  return { active, completed, loading };
}
