import { ProgressBar } from '@/components/shared/ProgressBar';
import { Badge } from '@/components/shared/Badge';
import type { TierProgress, TierName } from '@/types';
import { cn } from '@/lib/utils';

interface TierMeterProps {
  progress: TierProgress;
  className?: string;
}

const TIER_VARIANT: Record<TierName, 'bronze' | 'silver' | 'gold' | 'platinum'> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
};

export function TierMeter({ progress, className }: TierMeterProps) {
  const { current, next, pointsNeeded, progressPercent } = progress;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Badge
          label={current.label}
          variant={TIER_VARIANT[current.id]}
          emoji={current.badgeEmoji}
        />
        {next && (
          <span className="text-xs text-n-500">
            {pointsNeeded?.toLocaleString('en-GB')} pts to {next.label}
          </span>
        )}
        {!next && (
          <span className="text-xs font-medium text-primary">Max tier reached!</span>
        )}
      </div>

      <ProgressBar
        value={progressPercent}
        aria-label={`Tier progress: ${Math.round(progressPercent)}%`}
        color={`bg-[${current.color}]`}
      />

      <p className="text-xs text-n-500">
        {current.multiplier}× points multiplier on all transactions
      </p>
    </div>
  );
}
