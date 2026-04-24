'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { useStreak } from '@/lib/hooks/useStreak';
import { resolveTierProgress } from '@/lib/tier/resolver';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HorseMark } from '@/components/ui/HorseMark';
import type { TierName } from '@/types';

// In production this comes from the user's Firestore doc / household membership
const DEMO_HOUSEHOLD_ID = 'demo-household';

const RECENT_TXS = [
  { emoji: '🛒', name: 'Tesco Metro', time: 'Today, 14:22', amount: '−£42.18', points: '+52' },
  { emoji: '☕', name: 'Pret a Manger', time: 'Today, 09:10', amount: '−£4.95', points: '+6' },
  { emoji: '🚆', name: 'TfL Oyster', time: 'Yesterday', amount: '−£6.80', points: '+8' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { members } = useLeaderboard(DEMO_HOUSEHOLD_ID);
  const { streak } = useStreak(user?.uid);

  const me = members.find((m) => m.uid === user?.uid) ?? members[0];
  const totalPoints = me?.totalPoints ?? 0;
  const { current, next, pointsNeeded, progressPercent } = resolveTierProgress(totalPoints);
  const rank = me ? members.indexOf(me) + 1 : 1;

  const displayName = user?.displayName ?? me?.displayName ?? 'there';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6">
      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Avatar name={displayName} size="lg" />
        <div>
          <h1 className="text-[22px] font-extrabold text-navy leading-tight tracking-tight">
            Hi, {firstName} 👋
          </h1>
          <p className="text-[13px] text-n-500 mt-0.5">Welcome back to SpendStack</p>
        </div>
      </div>

      {/* ── Hero points card ──────────────────────────────────────────── */}
      <Card padding="none" className="bg-brand-gradient text-white overflow-hidden relative">
        {/* Horse watermark */}
        <div className="absolute right-0 top-0 opacity-[0.07] pointer-events-none" aria-hidden="true">
          <HorseMark size={200} color="#fff" />
        </div>
        <div className="relative p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] opacity-80">
            Points balance
          </p>
          <div className="text-[44px] font-black leading-none mt-1 mb-3 tabular">
            {totalPoints.toLocaleString('en-GB')}
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-white/25 text-white border border-white/30">
              {current.badgeEmoji} {current.label}
            </span>
            {next && (
              <span className="opacity-85">
                {pointsNeeded?.toLocaleString('en-GB')} pts to {next.label}
              </span>
            )}
          </div>
          <div className="mt-3">
            <ProgressBar value={progressPercent} color="rgba(255,255,255,0.85)" height={6} />
          </div>
        </div>
      </Card>

      {/* ── Quick stats grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/streak">
          <Card padding="sm" className="flex flex-col gap-1 hover:shadow-card-hover transition-shadow">
            <p className="text-[11px] font-semibold text-n-500 uppercase tracking-[0.04em]">Streak 🔥</p>
            <div className="text-[28px] font-black text-primary leading-none tabular">
              {streak?.currentDays ?? 0}
              <span className="text-sm font-bold ml-0.5">d</span>
            </div>
            <p className="text-[11px] text-n-500">Longest {streak?.longestDays ?? 0}d</p>
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card padding="sm" className="flex flex-col gap-1 hover:shadow-card-hover transition-shadow">
            <p className="text-[11px] font-semibold text-n-500 uppercase tracking-[0.04em]">Rank 🏆</p>
            <div className="text-[28px] font-black text-primary leading-none tabular">
              #{rank}
              <span className="text-sm font-bold ml-0.5">/{members.length || 1}</span>
            </div>
            <p className="text-[11px] text-n-500">In your household</p>
          </Card>
        </Link>
      </div>

      {/* ── Action shortcuts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { href: '/quests', emoji: '✨', label: 'Quests' },
          { href: '/store',  emoji: '🎁', label: 'Store'  },
          { href: '/coach',  emoji: '💬', label: 'Coach'  },
        ].map(({ href, emoji, label }) => (
          <Link key={href} href={href}>
            <Card
              padding="sm"
              className="flex flex-col items-center gap-1 py-3 hover:shadow-card-hover transition-shadow"
            >
              <span className="text-[22px]" aria-hidden="true">{emoji}</span>
              <span className="text-[12px] font-semibold text-navy">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Recent activity ───────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold text-navy">Recent activity</h3>
          <button className="text-[12px] font-semibold text-primary">See all</button>
        </div>
        <div className="flex flex-col">
          {RECENT_TXS.map((tx, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-n-200' : ''}`}
            >
              <div className="w-9 h-9 rounded-[10px] bg-n-100 flex items-center justify-center text-[18px] shrink-0">
                {tx.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-navy">{tx.name}</p>
                <p className="text-[12px] text-n-500">{tx.time}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-navy tabular">{tx.amount}</p>
                <p className="text-[12px] font-semibold text-primary">{tx.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tier badge for type usage check */}
      <div className="hidden">
        {(['bronze', 'silver', 'gold', 'platinum'] as TierName[]).map((t) => (
          <Badge key={t} variant={t}>{t}</Badge>
        ))}
      </div>
    </div>
  );
}
