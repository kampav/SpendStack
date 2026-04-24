'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { resolveTierProgress } from '@/lib/tier/resolver';
import { TIERS } from '@/lib/tier/resolver';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { TierName } from '@/types';

const DEMO_HOUSEHOLD_ID = 'demo-household';

// Perks per tier
const PERKS: Record<TierName, { icon: string; title: string; body: string }[]> = {
  bronze: [
    { icon: '⚡', title: '1× points',        body: 'On all qualifying transactions' },
    { icon: '🎁', title: 'Store access',      body: 'Standard redemptions catalogue' },
    { icon: '🎯', title: '1 bonus quest/mo',  body: 'Extra AI-powered quest each month' },
  ],
  silver: [
    { icon: '⚡', title: '1.25× points',      body: 'On all qualifying transactions' },
    { icon: '🎁', title: 'Full store access', body: 'Including experiences & charity' },
    { icon: '🎯', title: '1 bonus quest/mo',  body: 'Extra AI-powered quest each month' },
  ],
  gold: [
    { icon: '⚡', title: '1.5× points',       body: 'On all qualifying transactions' },
    { icon: '🎁', title: 'Premium store',      body: 'Full catalogue including VIP experiences' },
    { icon: '🎯', title: '2 bonus quests/mo', body: '2 extra quests each month' },
  ],
  platinum: [
    { icon: '⚡', title: '2× points',         body: 'Maximum multiplier on all transactions' },
    { icon: '🎁', title: 'Concierge store',   body: 'Bespoke rewards on request' },
    { icon: '🎯', title: '3 bonus quests/mo', body: '3 extra quests each month' },
    { icon: '👑', title: 'Platinum status',   body: 'Priority support & exclusive events' },
  ],
};

export default function TierPage() {
  const { user } = useAuth();
  const { members, loading } = useLeaderboard(DEMO_HOUSEHOLD_ID);

  const me = members.find((m) => m.uid === user?.uid) ?? members[0];
  const totalPoints = me?.totalPoints ?? 0;
  const { current, next, pointsNeeded, progressPercent } = resolveTierProgress(totalPoints);

  const perks = PERKS[current.id];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="h-10 w-32 bg-n-200 animate-pulse rounded-lg" />
        <div className="h-48 bg-n-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Your tier</h1>
        <p className="text-[13px] text-n-500 mt-1">Lifetime points unlock tiers</p>
      </div>

      {/* ── Tier hero card ────────────────────────────────────────────── */}
      <Card padding="none" className="overflow-hidden">
        {/* Tinted gradient header */}
        <div
          className="px-5 pt-7 pb-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${current.color}40 0%, ${current.color}15 100%)`,
          }}
        >
          <div className="text-[56px] leading-none mb-2" aria-hidden="true">
            {current.badgeEmoji}
          </div>
          <p className="text-[13px] font-bold text-n-500 uppercase tracking-[0.06em]">
            Current tier
          </p>
          <h2 className="text-[32px] font-black text-navy mt-1 tracking-tight">
            {current.label}
          </h2>
          {/* Multiplier pill */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white text-[13px] font-bold text-primary shadow-sm">
            {current.multiplier}× points multiplier
          </div>
        </div>

        {/* Progress to next */}
        <div className="px-5 py-5 border-t border-n-200">
          {next ? (
            <>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-[13px] font-semibold text-navy">
                  Progress to {next.label} {next.badgeEmoji}
                </p>
                <p className="text-[12px] text-n-500 tabular">
                  {pointsNeeded?.toLocaleString('en-GB')} pts to go
                </p>
              </div>
              <ProgressBar value={progressPercent} color="gradient" height={10} />
              <div className="flex justify-between text-[11px] text-n-500 mt-1.5 tabular">
                <span>{totalPoints.toLocaleString('en-GB')} pts</span>
                <span>{next.minPoints.toLocaleString('en-GB')} pts</span>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-[15px] font-bold text-primary">Max tier reached 👑</p>
              <p className="text-[12px] text-n-500 mt-1">You&apos;re at the top. Platinum perks for life.</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Tier ladder ───────────────────────────────────────────────── */}
      <Card>
        <h3 className="text-[15px] font-bold text-navy mb-3">Tier ladder</h3>
        {TIERS.map((t, i) => {
          const unlocked = totalPoints >= t.minPoints;
          const isCurrent = t.id === current.id;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-n-200' : ''}`}
              style={{ opacity: unlocked ? 1 : 0.45 }}
            >
              {/* Tier icon */}
              <div
                className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-[22px]"
                style={{
                  background: `${t.color}22`,
                  border: `${isCurrent ? 2 : 1}px solid ${t.color}${isCurrent ? '' : '44'}`,
                }}
              >
                {t.badgeEmoji}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-navy">{t.label}</p>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <p className="text-[12px] text-n-500 tabular mt-0.5">
                  {t.minPoints.toLocaleString('en-GB')}
                  {t.maxPoints ? `–${t.maxPoints.toLocaleString('en-GB')}` : '+'} pts
                </p>
              </div>

              <div className="text-right">
                <p className="text-[15px] font-extrabold tabular" style={{ color: unlocked ? '#006A4D' : '#718096' }}>
                  {t.multiplier}×
                </p>
                <p className="text-[10px] text-n-500 uppercase tracking-[0.04em]">Points</p>
              </div>
            </div>
          );
        })}
      </Card>

      {/* ── Your perks ────────────────────────────────────────────────── */}
      <Card>
        <h3 className="text-[15px] font-bold text-navy mb-3">Your {current.label} perks</h3>
        {perks.map((p, i) => (
          <div key={i} className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-n-200' : ''}`}>
            <div className="w-8 h-8 rounded-[10px] bg-n-100 flex items-center justify-center text-[16px] shrink-0">
              {p.icon}
            </div>
            <div>
              <p className="text-[14px] font-bold text-navy">{p.title}</p>
              <p className="text-[12px] text-n-500 mt-0.5">{p.body}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
