'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { LeaderboardRow } from './LeaderboardRow';

interface LeaderboardListProps {
  householdId: string;
}

export function LeaderboardList({ householdId }: LeaderboardListProps) {
  const { user } = useAuth();
  const { members, loading, error } = useLeaderboard(householdId);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-n-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-error" role="alert">
        Failed to load leaderboard. Please refresh.
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-n-500">
        No members yet. Invite your household to get started!
      </p>
    );
  }

  return (
    <ol className="space-y-2" aria-label="Household leaderboard">
      {members.map((member, idx) => (
        <li key={member.uid}>
          <LeaderboardRow
            member={member}
            rank={idx + 1}
            isCurrentUser={member.uid === user?.uid}
          />
        </li>
      ))}
    </ol>
  );
}
