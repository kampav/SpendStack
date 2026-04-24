import { cn } from '@/lib/utils';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import type { HouseholdMember, TierName } from '@/types';

interface LeaderboardRowProps {
  member: HouseholdMember;
  rank: number;
  isCurrentUser: boolean;
}

const TIER_BADGE_VARIANT: Record<TierName, 'bronze' | 'silver' | 'gold' | 'platinum'> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
};

const TIER_EMOJI: Record<TierName, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export function LeaderboardRow({ member, rank, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        isCurrentUser
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'bg-white hover:bg-n-100'
      )}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      {/* Rank */}
      <span
        className={cn(
          'w-7 shrink-0 text-center text-sm font-bold',
          rank === 1 ? 'text-gold' : rank <= 3 ? 'text-n-500' : 'text-n-500/60'
        )}
      >
        {rank === 1 ? '👑' : rank}
      </span>

      <Avatar src={member.photoURL} name={member.displayName} size="sm" />

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', isCurrentUser ? 'text-primary' : 'text-navy')}>
          {member.displayName}
          {isCurrentUser && <span className="ml-1.5 text-xs font-normal text-n-500">(you)</span>}
        </p>
        <p className="text-xs text-n-500">
          {member.streakDays > 0 && `🔥 ${member.streakDays}d streak`}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <Badge
          label={member.tier}
          variant={TIER_BADGE_VARIANT[member.tier]}
          emoji={TIER_EMOJI[member.tier]}
        />
        <span className="text-sm font-bold text-navy">
          {member.totalPoints.toLocaleString('en-GB')} pts
        </span>
      </div>
    </div>
  );
}
