'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { questConverter } from '@/lib/firebase/converters';
import type { Quest } from '@/types';

export function useQuests(uid: string | undefined) {
  const [quests, setQuests]   = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Single-field where only — no orderBy — avoids composite index requirement.
    // Firestore auto-provisions single-field indexes; composite ones must be
    // manually created. We sort client-side instead.
    const q = query(
      collection(db, 'quests').withConverter(questConverter),
      where('userId', '==', uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const sorted = snap.docs
          .map((d) => d.data())
          .sort((a, b) => b.createdAt - a.createdAt);
        setQuests(sorted);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [uid]);

  return { quests, loading, error };
}
