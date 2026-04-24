import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  color?: string; // tailwind bg- class or hex
  className?: string;
}

export function ProgressBar({ value, label, color, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-n-500">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-n-200"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', color ?? 'bg-primary')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
