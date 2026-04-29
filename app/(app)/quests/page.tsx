'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuests } from '@/lib/hooks/useQuests';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Quest, TransactionCategory } from '@/types';
import { FLAGS } from '@/lib/config/featureFlags';

// ── Category → emoji map ──────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<TransactionCategory, string> = {
  groceries:     '🛒',
  dining:        '🍽️',
  travel:        '✈️',
  utilities:     '⚡',
  entertainment: '🎬',
  shopping:      '🛍️',
  other:         '⭐',
};

// ── Derived display values from Firestore Quest ───────────────────────────────
function questProgress(q: Quest): number {
  if (q.targetAmount <= 0) return q.status === 'completed' ? 100 : 0;
  return Math.min(100, Math.round((q.currentAmount / q.targetAmount) * 100));
}

function daysLeft(q: Quest): number {
  return Math.max(0, Math.ceil((q.expiresAt - Date.now()) / 86_400_000));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function QuestSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl bg-n-200 animate-pulse h-28" />
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <Card className="text-center py-8">
      <p className="text-[36px]">🎯</p>
      <p className="text-[16px] font-bold text-navy mt-3">No quests yet</p>
      <p className="text-[13px] text-n-500 mt-1 mb-4">
        Generate AI-powered quests based on your spending habits
      </p>
      <Button onClick={onGenerate} loading={loading}>
        ✨ Generate my quests
      </Button>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuestsPage() {
  const { user } = useAuth();
  const { quests, loading } = useQuests(user?.uid);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');

  // ── Feature flag guard (hooks are above) ─────────────────────────────────
  if (!FLAGS.AI_QUESTS) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
        <div>
          <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Quests</h1>
          <p className="text-[13px] text-n-500 mt-1">AI-powered weekly challenges</p>
        </div>
        <div className="rounded-2xl border border-n-200 bg-white p-8 text-center">
          <p className="text-[40px]" aria-hidden="true">🚧</p>
          <p className="text-[17px] font-extrabold text-navy mt-3">Being built live</p>
          <p className="text-[13px] text-n-500 mt-2 max-w-[240px] mx-auto">
            This feature is being built right now. Check back in a moment.
          </p>
        </div>
      </div>
    );
  }

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    setGenError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/quests/generate', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) setGenError('Generation failed — try again.');
    } catch {
      setGenError('Network error — try again.');
    } finally {
      setGenerating(false);
    }
  }

  const active    = quests.filter((q) => q.status === 'active');
  const completed = quests.filter((q) => q.status === 'completed');
  const expired   = quests.filter((q) => q.status === 'expired');

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Quests</h1>
          <p className="text-[13px] text-n-500 mt-1">AI-powered weekly challenges</p>
        </div>
        {quests.length > 0 && (
          <Button size="sm" onClick={handleGenerate} loading={generating}>
            ✨ Generate
          </Button>
        )}
      </div>

      {genError && (
        <p role="alert" className="text-[13px] text-error font-semibold px-1">
          ⚠️ {genError}
        </p>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && <QuestSkeleton />}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!loading && quests.length === 0 && (
        <EmptyState onGenerate={handleGenerate} loading={generating} />
      )}

      {/* ── Active quests ─────────────────────────────────────────────── */}
      {!loading && active.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.04em] mb-2">
            Active
          </p>
          <div className="flex flex-col gap-3">
            {active.map((q) => {
              const pct = questProgress(q);
              const left = daysLeft(q);
              return (
                <Card key={q.id} className="border-t-2 border-accent">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-[10px] bg-n-100 flex items-center justify-center text-[20px] shrink-0">
                      {CATEGORY_EMOJI[q.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-navy">{q.title}</p>
                      <p className="text-[13px] text-n-500 mt-0.5 line-clamp-2">{q.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-[#D4A01733] text-[#8a6508]">
                        +{q.pointsReward}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={pct} color="green" height={8} />
                  <div className="flex justify-between mt-2 text-[11px] text-n-500">
                    <span>{pct}% complete</span>
                    <span>{left}d left</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completed ─────────────────────────────────────────────────── */}
      {!loading && completed.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.04em] mb-2">
            Completed
          </p>
          <div className="flex flex-col gap-3">
            {completed.map((q) => (
              <Card key={q.id} className="opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-accent/10 flex items-center justify-center text-[20px] shrink-0 relative">
                    {CATEGORY_EMOJI[q.category]}
                    <span className="absolute -bottom-0.5 -right-0.5 text-[12px]">✅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-navy">{q.title}</p>
                    <p className="text-[12px] text-accent font-semibold">+{q.pointsReward} pts earned</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Expired ───────────────────────────────────────────────────── */}
      {!loading && expired.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.04em] mb-2">
            Expired
          </p>
          <div className="flex flex-col gap-2">
            {expired.map((q) => (
              <Card key={q.id} className="opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-n-200 flex items-center justify-center text-[16px] shrink-0">
                    {CATEGORY_EMOJI[q.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-n-500 line-through">{q.title}</p>
                    <p className="text-[11px] text-n-500">{questProgress(q)}% · expired</p>
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
