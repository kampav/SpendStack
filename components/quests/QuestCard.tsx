import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/shared/ProgressBar';
import type { Quest } from '@/types';

interface QuestCardProps {
  quest: Quest;
  className?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  groceries: '🛒',
  dining: '🍽️',
  travel: '✈️',
  utilities: '💡',
  entertainment: '🎬',
  shopping: '🛍️',
  other: '💳',
};

export function QuestCard({ quest, className }: QuestCardProps) {
  const progressPct = quest.targetAmount > 0
    ? Math.min(100, (quest.currentAmount / quest.targetAmount) * 100)
    : 0;
  const isComplete = quest.status === 'completed';
  const daysLeft = Math.max(
    0,
    Math.ceil((quest.expiresAt - Date.now()) / 86_400_000)
  );

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        isComplete && 'border-primary/30 bg-primary/5',
        className
      )}
      aria-label={quest.title}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {CATEGORY_EMOJI[quest.category] ?? '💳'}
          </span>
          <h3 className="text-sm font-semibold text-navy">{quest.title}</h3>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            isComplete
              ? 'bg-primary/20 text-primary'
              : 'bg-gold/20 text-amber-700'
          )}
        >
          {isComplete ? '✅ Done' : `${daysLeft}d left`}
        </span>
      </div>

      <p className="mb-3 text-xs text-n-500">{quest.description}</p>

      <ProgressBar value={progressPct} />

      <div className="mt-2 flex items-center justify-between text-xs text-n-500">
        <span>
          £{(quest.currentAmount / 100).toFixed(2)} / £{(quest.targetAmount / 100).toFixed(2)}
        </span>
        <span className="font-medium text-gold">+{quest.pointsReward.toLocaleString('en-GB')} pts</span>
      </div>
    </div>
  );
}
