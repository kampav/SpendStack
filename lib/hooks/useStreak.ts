'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { streakConverter } from '@/lib/firebase/converters';
import type { Streak } from '@/types';

export function useStreak(uid: string | undefined) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'streaks', uid).withConverter(streakConverter);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setStreak(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  return { streak, loading, error };
}
