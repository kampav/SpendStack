'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useStreak } from '@/lib/hooks/useStreak';
import { useTier } from '@/lib/hooks/useTier';
import { PageHeader } from '@/components/shared/PageHeader';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { StreakMilestone } from '@/components/streak/StreakMilestone';
import { TierMeter } from '@/components/tier/TierMeter';
import { Avatar } from '@/components/shared/Avatar';

// Placeholder total points — in production, read from Firestore member doc
const DEMO_TOTAL_POINTS = 1_340;

export default function DashboardPage() {
  const { user } = useAuth();
  const { streak, loading: streakLoading } = useStreak(user?.uid);
  const tierProgress = useTier(DEMO_TOTAL_POINTS);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <Avatar
          src={user?.photoURL}
          name={user?.displayName ?? user?.email ?? 'User'}
          size="lg"
        />
        <div>
          <PageHeader
            title={`Hi, ${user?.displayName?.split(' ')[0] ?? 'there'} 👋`}
            subtitle={`${DEMO_TOTAL_POINTS.toLocaleString('en-GB')} points total`}
          />
        </div>
      </div>

      {/* Tier progress */}
      <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="tier-heading">
        <h2 id="tier-heading" className="mb-3 text-sm font-semibold text-navy">Your Tier</h2>
        <TierMeter progress={tierProgress} />
      </section>

      {/* Streak */}
      <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="streak-heading">
        <h2 id="streak-heading" className="mb-3 text-sm font-semibold text-navy">Streak</h2>
        {streakLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-n-200" />
        ) : streak ? (
          <>
            <StreakCalendar streak={streak} />
            <StreakMilestone currentDays={streak.currentDays} className="mt-4" />
          </>
        ) : (
          <p className="text-sm text-n-500">Make your first transaction to start a streak!</p>
        )}
      </section>
    </div>
  );
}
