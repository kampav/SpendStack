'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HorseMark } from '@/components/ui/HorseMark';
import type { TierName } from '@/types';

const DEMO_HOUSEHOLD_ID = 'demo-household';

type Period = 'week' | 'month' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'week',  label: 'This week'  },
  { id: 'month', label: 'This month' },
  { id: 'all',   label: 'All time'   },
];

function tierLabel(t: TierName) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { members, loading } = useLeaderboard(DEMO_HOUSEHOLD_ID);
  const [period, setPeriod] = useState<Period>('month');

  // Client-side sort — pointsByPeriod not yet aggregated, so we use totalPoints
  // for all periods. Swap this for period-specific data when available.
  const sorted = useMemo(
    () => [...members].sort((a, b) => b.totalPoints - a.totalPoints),
    [members],
  );

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Podium order: 2nd (left) · 1st (centre) · 3rd (right)
  const podium = [top3[1], top3[0], top3[2]];
  const podiumHeights = [52, 76, 36]; // px

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="h-8 w-48 bg-n-200 animate-pulse rounded-lg" />
        <div className="h-48 bg-n-200 animate-pulse rounded-xl" />
        <div className="h-32 bg-n-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Leaderboard</h1>
        <p className="text-[13px] text-n-500 mt-1">How your household ranks</p>
      </div>

      {/* ── Period segmented control ──────────────────────────────────── */}
      <div className="flex p-1 bg-n-100 rounded-[10px]">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPeriod(id)}
            className={`flex-1 py-2 px-3 text-[13px] font-semibold rounded-lg transition-all duration-150 ${
              period === id
                ? 'bg-white text-navy shadow-sm'
                : 'text-n-500 hover:text-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Podium ────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-[15px] font-bold text-navy">No activity yet {period === 'week' ? 'this week' : period === 'month' ? 'this month' : ''}</p>
          <p className="text-[13px] text-n-500 mt-1">Make a transaction to appear on the board</p>
        </Card>
      ) : (
        <Card padding="none" className="bg-brand-gradient overflow-hidden relative">
          {/* Horse watermark */}
          <div className="absolute right-0 top-0 h-full opacity-[0.06] flex items-center pointer-events-none" aria-hidden="true">
            <HorseMark size={180} color="#fff" />
          </div>

          <div className="relative flex items-end justify-center gap-3 px-4 pt-6 pb-0">
            {podium.map((m, visIdx) => {
              if (!m) return <div key={`empty-${visIdx}`} className="w-20" />;
              const rank = sorted.indexOf(m) + 1;
              const isFirst = rank === 1;
              const isMe = m.uid === user?.uid;
              const h = podiumHeights[visIdx];

              return (
                <div key={m.uid} className="flex flex-col items-center w-20">
                  {/* Crown for rank 1 */}
                  {isFirst && (
                    <span className="text-[20px] mb-1" aria-hidden="true">👑</span>
                  )}
                  <Avatar
                    name={m.displayName}
                    size="lg"
                    ring={isFirst ? '#D4A017' : 'rgba(255,255,255,0.5)'}
                  />
                  <p className="text-[12px] font-bold text-white mt-2 text-center truncate w-full">
                    {m.displayName.split(' ')[0]}{isMe && ' (you)'}
                  </p>
                  <p className="text-[11px] text-white/80 tabular">
                    {m.totalPoints.toLocaleString('en-GB')} pts
                  </p>
                  {/* Podium block */}
                  <div
                    className="mt-2 w-full rounded-t-lg flex items-center justify-center text-[18px] font-black"
                    style={{
                      height: h,
                      background: isFirst ? '#D4A017' : 'rgba(255,255,255,0.22)',
                      color: isFirst ? '#1A2B3C' : '#fff',
                    }}
                  >
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Rank rows 4+ ──────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <Card padding="none">
          {rest.map((m, i) => {
            const rank = sorted.indexOf(m) + 1;
            const isMe = m.uid === user?.uid;
            return (
              <div
                key={m.uid}
                className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-n-200' : ''} ${isMe ? 'bg-primary/[0.05]' : ''}`}
              >
                <span className="w-6 text-center text-[14px] font-bold text-n-500 tabular">{rank}</span>
                <Avatar name={m.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-semibold truncate ${isMe ? 'text-primary' : 'text-navy'}`}>
                    {m.displayName}
                    {isMe && <span className="ml-1.5 text-[11px] text-n-500 font-normal">(you)</span>}
                  </p>
                  {m.streakDays > 0 && (
                    <p className="text-[11px] text-n-500">🔥 {m.streakDays}d streak</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={m.tier as TierName}>{tierLabel(m.tier as TierName)}</Badge>
                  <p className="text-[13px] font-bold text-navy mt-1 tabular">
                    {m.totalPoints.toLocaleString('en-GB')} pts
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Invite CTA ────────────────────────────────────────────────── */}
      <Card className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center text-[20px] shrink-0">
          👥
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-navy">Invite household</p>
          <p className="text-[12px] text-n-500">Grow the table. Share your household code.</p>
        </div>
        <Button size="sm">Invite</Button>
      </Card>
    </div>
  );
}
