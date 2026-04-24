'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';

// Placeholder household ID — in production, read from user's Firestore doc
const DEMO_HOUSEHOLD_ID = 'demo-household';

export default function LeaderboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        subtitle="How your household ranks this month"
      />

      {user && <LeaderboardList householdId={DEMO_HOUSEHOLD_ID} />}
    </div>
  );
}
