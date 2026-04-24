'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { useStreak } from '@/lib/hooks/useStreak';
import { resolveTier } from '@/lib/tier/resolver';
import { auth } from '@/lib/firebase/client';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { TierName } from '@/types';

const DEMO_HOUSEHOLD_ID = 'demo-household';

const SETTINGS = [
  { icon: '🏠', label: 'Household settings' },
  { icon: '🔔', label: 'Notifications'       },
  { icon: '🔒', label: 'Privacy & data'      },
  { icon: '❓', label: 'Help & support'       },
] as const;

export default function ProfilePage() {
  const { user } = useAuth();
  const { members } = useLeaderboard(DEMO_HOUSEHOLD_ID);
  const { streak } = useStreak(user?.uid);
  const router = useRouter();

  const me = members.find((m) => m.uid === user?.uid) ?? members[0];
  const totalPoints = me?.totalPoints ?? 0;
  const tier = resolveTier(totalPoints);

  const displayName = user?.displayName ?? me?.displayName ?? 'Demo User';

  async function handleSignOut() {
    await signOut(auth);
    router.replace('/sign-in');
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Identity ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <Avatar name={displayName} size="xl" />
        <h2 className="text-[22px] font-extrabold text-navy mt-3">{displayName}</h2>
        <p className="text-[13px] text-n-500 mt-0.5">{user?.email}</p>
        <div className="mt-3">
          <Badge variant={tier.id as TierName} emoji={tier.badgeEmoji}>
            {tier.label}
          </Badge>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="grid grid-cols-3 divide-x divide-n-200 text-center">
          <div className="px-2 py-1">
            <p className="text-[11px] font-semibold text-n-500 uppercase tracking-[0.04em]">Points</p>
            <p className="text-[20px] font-black text-primary mt-1 tabular">
              {totalPoints.toLocaleString('en-GB')}
            </p>
          </div>
          <div className="px-2 py-1">
            <p className="text-[11px] font-semibold text-n-500 uppercase tracking-[0.04em]">Streak</p>
            <p className="text-[20px] font-black text-primary mt-1 tabular">
              {streak?.currentDays ?? 0}<span className="text-[13px]">d</span>
            </p>
          </div>
          <div className="px-2 py-1">
            <p className="text-[11px] font-semibold text-n-500 uppercase tracking-[0.04em]">Best</p>
            <p className="text-[20px] font-black text-primary mt-1 tabular">
              {streak?.longestDays ?? 0}<span className="text-[13px]">d</span>
            </p>
          </div>
        </div>
      </Card>

      {/* ── Settings rows ─────────────────────────────────────────────── */}
      <Card padding="none">
        {SETTINGS.map(({ icon, label }, i) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-n-100 transition-colors ${i > 0 ? 'border-t border-n-200' : ''}`}
          >
            <span className="text-[18px]" aria-hidden="true">{icon}</span>
            <span className="flex-1 text-[14px] font-semibold text-navy">{label}</span>
            <span className="text-n-500 text-[18px]">›</span>
          </button>
        ))}
      </Card>

      {/* ── Sign out ──────────────────────────────────────────────────── */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-xl border border-n-200 text-[14px] font-semibold text-error hover:bg-error/[0.05] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
