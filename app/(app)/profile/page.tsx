'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useTier } from '@/lib/hooks/useTier';
import { useStreak } from '@/lib/hooks/useStreak';
import { PageHeader } from '@/components/shared/PageHeader';
import { Avatar } from '@/components/shared/Avatar';
import { TierMeter } from '@/components/tier/TierMeter';

const DEMO_TOTAL_POINTS = 1_340;

export default function ProfilePage() {
  const { user } = useAuth();
  const tierProgress = useTier(DEMO_TOTAL_POINTS);
  const { streak } = useStreak(user?.uid);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />

      {/* Identity card */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.photoURL}
            name={user?.displayName ?? user?.email ?? 'User'}
            size="lg"
          />
          <div>
            <p className="font-bold text-navy">{user?.displayName ?? '—'}</p>
            <p className="text-xs text-n-500">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-4 text-sm font-semibold text-navy">Your stats</h2>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-n-500">Points</dt>
            <dd className="mt-1 text-xl font-black text-primary">
              {DEMO_TOTAL_POINTS.toLocaleString('en-GB')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-n-500">Streak</dt>
            <dd className="mt-1 text-xl font-black text-primary">
              {streak?.currentDays ?? 0}d
            </dd>
          </div>
          <div>
            <dt className="text-xs text-n-500">Best</dt>
            <dd className="mt-1 text-xl font-black text-primary">
              {streak?.longestDays ?? 0}d
            </dd>
          </div>
        </dl>
      </section>

      {/* Tier */}
      <section className="rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="tier-heading">
        <h2 id="tier-heading" className="mb-4 text-sm font-semibold text-navy">Tier progress</h2>
        <TierMeter progress={tierProgress} />
      </section>
    </div>
  );
}
