'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuestCard } from '@/components/quests/QuestCard';
import type { Quest } from '@/types';

// Placeholder data — replace with Firestore onSnapshot when implementing AI Quests
const DEMO_QUESTS: Quest[] = [
  {
    id: 'q1',
    userId: '',
    title: 'Grocery Champion',
    description: 'Spend £50 at supermarkets this week',
    category: 'groceries',
    targetAmount: 5000,
    currentAmount: 3200,
    pointsReward: 150,
    status: 'active',
    expiresAt: Date.now() + 3 * 86_400_000,
    createdAt: Date.now() - 86_400_000,
  },
  {
    id: 'q2',
    userId: '',
    title: 'Foodie Explorer',
    description: 'Dine out 3 times this week',
    category: 'dining',
    targetAmount: 3000,
    currentAmount: 3000,
    pointsReward: 200,
    status: 'completed',
    expiresAt: Date.now() + 2 * 86_400_000,
    createdAt: Date.now() - 2 * 86_400_000,
  },
];

export default function QuestsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function generateQuests() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/quests/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quests"
        subtitle="AI-powered challenges tailored to your spending"
        action={
          <button
            onClick={generateQuests}
            disabled={loading}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Generating…' : '✨ New quests'}
          </button>
        }
      />

      <div className="space-y-3">
        {DEMO_QUESTS.map((q) => (
          <QuestCard key={q.id} quest={q} />
        ))}
      </div>
    </div>
  );
}
