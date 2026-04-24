import { cn } from '@/lib/utils';
import { MILESTONES } from '@/lib/streak/engine';

interface StreakMilestoneProps {
  currentDays: number;
  className?: string;
}

export function StreakMilestone({ currentDays, className }: StreakMilestoneProps) {
  const next = MILESTONES.find((m) => m.days > currentDays);
  const achieved = MILESTONES.filter((m) => m.days <= currentDays);

  return (
    <div className={cn('space-y-3', className)}>
      {next && (
        <div className="rounded-xl bg-orange-50 p-3 text-sm">
          <p className="font-semibold text-orange-700">
            🎯 Next milestone: {next.label}
          </p>
          <p className="text-orange-600">
            {next.days - currentDays} more day{next.days - currentDays !== 1 ? 's' : ''} · +{next.reward.toLocaleString('en-GB')} pts
          </p>
        </div>
      )}

      {achieved.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-n-500 uppercase tracking-wide">Achieved</p>
          <div className="flex flex-wrap gap-2">
            {achieved.map((m) => (
              <span
                key={m.days}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                🏆 {m.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
