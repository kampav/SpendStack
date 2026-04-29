'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuests } from '@/lib/hooks/useQuests';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Quest, TransactionCategory } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<TransactionCategory, string> = {
  groceries:     '🛒',
  dining:        '🍽️',
  travel:        '✈️',
  utilities:     '⚡',
  entertainment: '🎬',
  shopping:      '🛍️',
  other:         '⭐',
};

/** ISO week number (1–53) */
function isoWeek(): number {
  const d   = new Date();
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const weekOfJan4 = Math.ceil((jan4.getDate() + (jan4.getDay() || 7) - 1) / 7);
  return Math.ceil((dayOfYear + (jan4.getDay() || 7) - 1) / 7) - weekOfJan4 + 1;
}

function progressPct(q: Quest): number {
  if (q.targetAmount <= 0) return q.status === 'completed' ? 100 : 0;
  return Math.min(100, Math.round((q.currentAmount / q.targetAmount) * 100));
}

function daysLeft(q: Quest): number {
  return Math.max(0, Math.ceil((q.expiresAt - Date.now()) / 86_400_000));
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Active QuestCard — per DESIGN.md QuestCard spec */
function ActiveQuestCard({ q }: { q: Quest }) {
  const pct  = progressPct(q);
  const left = daysLeft(q);

  return (
    <Card className="border-t-2 border-accent">
      {/* Header row: category icon + title + reward badge */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-[10px] bg-n-100 flex items-center justify-center text-[20px] shrink-0"
          aria-hidden="true"
        >
          {CATEGORY_EMOJI[q.category]}
        </div>
        <div className="flex-1 min-w-0">
          {/* h3 — DESIGN.md: 1.125rem (18px), weight 600 */}
          <p className="text-[15px] font-bold text-navy leading-snug">{q.title}</p>
          {/* body-sm — 2 lines max, ellipsis */}
          <p className="text-[13px] text-n-500 mt-0.5 line-clamp-2">{q.description}</p>
        </div>
        {/* Points reward badge — gold, per DESIGN.md */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold shrink-0"
          style={{ background: '#D4A01733', color: '#8a6508' }}
          aria-label={`${q.pointsReward} points reward`}
        >
          +{q.pointsReward}
        </span>
      </div>

      {/* ProgressBar — accent fill, 8px height per DESIGN.md */}
      <ProgressBar
        value={pct}
        color="green"
        height={8}
        label={`${pct}% complete`}
      />

      {/* Footer: progress % + expiry label */}
      <div className="flex justify-between mt-2 text-[11px] text-n-500">
        <span>{pct}% complete</span>
        <span>{left === 0 ? 'Expires today' : `${left}d left`}</span>
      </div>
    </Card>
  );
}

/** Completed QuestCard — greyed out with checkmark overlay per DESIGN.md */
function CompletedQuestCard({ q }: { q: Quest }) {
  return (
    <Card className="opacity-70">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-accent/10 flex items-center justify-center text-[20px] shrink-0 relative">
          <span aria-hidden="true">{CATEGORY_EMOJI[q.category]}</span>
          {/* Green checkmark overlay per DESIGN.md */}
          <span
            className="absolute -bottom-0.5 -right-0.5 text-[13px]"
            aria-hidden="true"
          >
            ✅
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-navy">{q.title}</p>
          <p className="text-[12px] text-accent font-semibold">
            +{q.pointsReward} pts earned
          </p>
        </div>
      </div>
    </Card>
  );
}

function QuestSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading quests">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-n-200 animate-pulse h-[110px]" />
      ))}
    </div>
  );
}

function EmptyState({
  onGenerate,
  loading,
}: {
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <Card className="text-center py-10">
      <p className="text-[40px]" aria-hidden="true">🎯</p>
      <p className="text-[17px] font-extrabold text-navy mt-3">No quests yet</p>
      <p className="text-[13px] text-n-500 mt-1 mb-5">
        Claude will generate 3 personalised challenges based on your recent spending.
      </p>
      {/* Spinner + label per DESIGN.md "spinner + Generating your quests…" */}
      <Button onClick={onGenerate} loading={loading}>
        {loading ? 'Generating your quests…' : '✨ Generate my quests'}
      </Button>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const { user }                  = useAuth();
  const { active, completed, loading } = useQuests(user?.uid);
  const [generating, setGenerating]    = useState(false);
  const [genError,   setGenError]      = useState('');
  const [pastOpen,   setPastOpen]      = useState(false);

  const week = isoWeek();

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

  const hasAny = active.length > 0 || completed.length > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header — "Your Quests" + week number (DESIGN.md §Quests) ──── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-navy tracking-tight">
            Your Quests
          </h1>
          <p className="text-[13px] text-n-500 mt-1">
            Week {week} · AI-powered weekly challenges
          </p>
        </div>
        {hasAny && !loading && (
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

      {/* ── Loading — skeleton placeholder cards ─────────────────────── */}
      {loading && <QuestSkeleton />}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!loading && !hasAny && (
        <EmptyState onGenerate={handleGenerate} loading={generating} />
      )}

      {/* ── Active quests — 3 QuestCards in vertical list ────────────── */}
      {!loading && active.length > 0 && (
        <section aria-label="Active quests">
          <p className="text-[12px] font-semibold text-n-500 uppercase tracking-[0.05em] mb-2">
            Active
          </p>
          <div className="flex flex-col gap-3">
            {active.map((q) => (
              <ActiveQuestCard key={q.id} q={q} />
            ))}
          </div>
        </section>
      )}

      {/* ── Past Quests — disclosure (DESIGN.md: "collapsed under Past Quests") */}
      {!loading && completed.length > 0 && (
        <section aria-label="Past quests">
          <button
            onClick={() => setPastOpen((o) => !o)}
            className="flex items-center gap-2 text-[12px] font-semibold text-n-500 uppercase tracking-[0.05em] mb-2 hover:text-navy transition-colors"
            aria-expanded={pastOpen}
          >
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: pastOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            >
              ›
            </span>
            Past Quests ({completed.length})
          </button>

          {pastOpen && (
            <div className="flex flex-col gap-3">
              {completed.map((q) => (
                <CompletedQuestCard key={q.id} q={q} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
