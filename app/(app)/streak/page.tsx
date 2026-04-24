'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStreak } from '@/lib/hooks/useStreak';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ── Milestone definitions ─────────────────────────────────────────────────────
const MILESTONES = [
  { days: 7,   label: '1 Week Warrior',   reward: 100  },
  { days: 14,  label: '2 Week Champion',  reward: 250  },
  { days: 30,  label: 'Monthly Master',   reward: 500  },
  { days: 60,  label: 'Bimonthly Legend', reward: 1000 },
  { days: 100, label: 'Century Club',     reward: 2000 },
] as const;

// ── Helper: build a 30-day active-day array from activeDates ─────────────────
function build30DayGrid(activeDates: string[]): boolean[] {
  const today = new Date();
  const result: boolean[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    result.push(activeDates.includes(iso));
  }
  return result; // index 0 = 30 days ago, index 29 = today
}

export default function StreakPage() {
  const { user } = useAuth();
  const { streak, loading } = useStreak(user?.uid);

  const currentDays = streak?.currentDays ?? 0;
  const longestDays = streak?.longestDays ?? 0;

  const grid = useMemo(
    () => build30DayGrid(streak?.activeDates ?? []),
    [streak?.activeDates],
  );
  const activeCount = grid.filter(Boolean).length;

  const nextMilestone = MILESTONES.find((m) => m.days > currentDays);
  const achieved = MILESTONES.filter((m) => m.days <= currentDays);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="h-32 bg-n-200 animate-pulse rounded-xl" />
        <div className="h-32 bg-n-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="text-center py-2">
        <p className="text-[12px] font-bold text-n-500 uppercase tracking-[0.05em]">
          Current streak
        </p>
        <div className="inline-flex items-baseline gap-1 mt-1">
          {currentDays === 0 ? (
            <span className="text-[48px] font-black text-primary leading-none">Start today</span>
          ) : (
            <>
              <span className="text-[72px] font-black text-primary leading-none tabular">
                {currentDays}
              </span>
              <span className="text-[26px] font-extrabold text-primary">d 🔥</span>
            </>
          )}
        </div>
        <p className="text-[13px] text-n-500 mt-1">
          Longest ever:{' '}
          <strong className="text-navy">{longestDays} days</strong>
        </p>
        {currentDays === 0 && (
          <p className="text-[13px] text-n-500 mt-1">Make a qualifying transaction to begin</p>
        )}
      </div>

      {/* ── Next milestone card (amber/warm gradient) ──────────────────── */}
      {currentDays <= 100 && nextMilestone && (
        <Card className="bg-streak-gradient border border-gold/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-[#C2410C] uppercase tracking-[0.04em]">
                🎯 Next milestone
              </p>
              <p className="text-[17px] font-extrabold text-navy mt-1">{nextMilestone.label}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-n-500">Reward</p>
              <p className="text-[16px] font-extrabold text-gold tabular">
                +{nextMilestone.reward.toLocaleString('en-GB')}
              </p>
            </div>
          </div>
          <ProgressBar
            value={(currentDays / nextMilestone.days) * 100}
            color="gold"
            height={10}
            showSheen
            label={`${currentDays} of ${nextMilestone.days} days`}
          />
          <p className="text-[12px] font-semibold text-[#C2410C] mt-2">
            {nextMilestone.days - currentDays} more day{nextMilestone.days - currentDays !== 1 ? 's' : ''} to go
          </p>
        </Card>
      )}

      {/* All milestones achieved state */}
      {currentDays > 100 && (
        <Card className="text-center py-6 bg-brand-gradient text-white">
          <p className="text-[32px]">🏆</p>
          <p className="text-[18px] font-black mt-2">Living legend.</p>
          <p className="text-[13px] opacity-80 mt-1">All milestones achieved.</p>
        </Card>
      )}

      {/* ── 30-day activity grid ───────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold text-navy">Last 30 days</h3>
          <span className="text-[11px] text-n-500">{activeCount}/30 active</span>
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
          aria-label="30-day activity calendar"
        >
          {grid.map((active, i) => {
            const isToday = i === grid.length - 1;
            const daysAgo = 29 - i;
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const label = `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${active ? 'active' : 'rest day'}`;

            return (
              <div
                key={i}
                title={label}
                aria-label={label}
                className="rounded-[4px] aspect-square"
                style={{
                  background: active ? '#006A4D' : '#E2E8F0',
                  boxShadow: isToday ? 'inset 0 0 0 2px #D4A017' : undefined,
                }}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-n-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-n-200" />
            Rest day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
            Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-primary" style={{ boxShadow: 'inset 0 0 0 1.5px #D4A017' }} />
            Today
          </span>
        </div>
      </Card>

      {/* ── Achievements ──────────────────────────────────────────────── */}
      {achieved.length > 0 && (
        <Card>
          <h3 className="text-[15px] font-bold text-navy mb-3">Achieved 🏆</h3>
          <div className="flex flex-wrap gap-2">
            {achieved.map((m) => (
              <span
                key={m.days}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/[0.08] text-primary text-[13px] font-semibold"
              >
                🏆 {m.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── All milestones roadmap ─────────────────────────────────────── */}
      <Card>
        <h3 className="text-[15px] font-bold text-navy mb-3">All milestones</h3>
        {MILESTONES.map((m, i) => {
          const done = m.days <= currentDays;
          const isNext = m === nextMilestone;
          return (
            <div
              key={m.days}
              className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-n-200' : ''}`}
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                style={{
                  background: done ? '#006A4D' : isNext ? '#D4A017' : '#F7F7F7',
                  color: done || isNext ? '#fff' : '#718096',
                }}
              >
                {done ? '✓' : m.days}
              </div>
              <div className="flex-1">
                <p className={`text-[14px] font-semibold ${done || isNext ? 'text-navy' : 'text-n-500'}`}>
                  {m.label}
                </p>
                <p className="text-[12px] text-n-500">{m.days} day streak</p>
              </div>
              <p
                className="text-[13px] font-bold tabular"
                style={{ color: done ? '#006A4D' : isNext ? '#D4A017' : '#718096' }}
              >
                +{m.reward.toLocaleString('en-GB')}
              </p>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
