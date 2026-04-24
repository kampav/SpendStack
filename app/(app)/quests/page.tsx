'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

// Demo quests — replace with Firestore onSnapshot from /api/quests/generate
const DEMO_QUESTS = [
  {
    id: 'q1',
    emoji: '🛒',
    title: 'Grocery Champion',
    description: 'Spend £50 at supermarkets this week',
    progress: 64,
    reward: 150,
    daysLeft: 3,
    status: 'active' as const,
  },
  {
    id: 'q2',
    emoji: '🍽️',
    title: 'Foodie Explorer',
    description: 'Dine out 3 times this week',
    progress: 100,
    reward: 200,
    daysLeft: 2,
    status: 'completed' as const,
  },
  {
    id: 'q3',
    emoji: '✈️',
    title: 'Travel Ready',
    description: 'Book one travel transaction',
    progress: 0,
    reward: 300,
    daysLeft: 5,
    status: 'active' as const,
  },
];

export default function QuestsPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/quests/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  const active = DEMO_QUESTS.filter((q) => q.status === 'active');
  const completed = DEMO_QUESTS.filter((q) => q.status === 'completed');

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Quests</h1>
          <p className="text-[13px] text-n-500 mt-1">AI-powered weekly challenges</p>
        </div>
        <Button size="sm" onClick={handleGenerate} loading={generating}>
          ✨ Generate
        </Button>
      </div>

      {/* ── Active quests ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.04em] mb-2">
          Active
        </p>
        <div className="flex flex-col gap-3">
          {active.map((q) => (
            <Card key={q.id} className="border-t-2 border-accent">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-[10px] bg-n-100 flex items-center justify-center text-[20px] shrink-0">
                  {q.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-navy">{q.title}</p>
                  <p className="text-[13px] text-n-500 mt-0.5 line-clamp-2">{q.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-[#D4A01733] text-[#8a6508]">
                    +{q.reward}
                  </span>
                </div>
              </div>
              <ProgressBar value={q.progress} color="green" height={8} />
              <div className="flex justify-between mt-2 text-[11px] text-n-500">
                <span>{q.progress}% complete</span>
                <span>{q.daysLeft}d left</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Completed ─────────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.04em] mb-2">
            Completed
          </p>
          <div className="flex flex-col gap-3">
            {completed.map((q) => (
              <Card key={q.id} className="opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-accent/10 flex items-center justify-center text-[20px] shrink-0 relative">
                    {q.emoji}
                    <span className="absolute -bottom-0.5 -right-0.5 text-[12px]">✅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-navy">{q.title}</p>
                    <p className="text-[12px] text-accent font-semibold">+{q.reward} pts earned</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
