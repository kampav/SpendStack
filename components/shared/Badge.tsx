import { cn } from '@/lib/utils';

type BadgeVariant = 'bronze' | 'silver' | 'gold' | 'platinum' | 'streak' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  emoji?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  bronze: 'bg-amber-700/15 text-amber-800 border-amber-700/30',
  silver: 'bg-slate-200/60 text-slate-700 border-slate-300',
  gold: 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40',
  platinum: 'bg-slate-100 text-slate-600 border-slate-300',
  streak: 'bg-orange-100 text-orange-700 border-orange-300',
  default: 'bg-n-100 text-n-500 border-n-200',
};

export function Badge({ label, variant = 'default', emoji, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
    </span>
  );
}
