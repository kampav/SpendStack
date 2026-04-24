import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Tailwind bg class or inline CSS colour/gradient — pass 'gradient' for brand */
  color?: 'green' | 'gold' | 'gradient' | string;
  height?: number;
  showSheen?: boolean;
  label?: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  green: 'bg-accent',
  gold: 'bg-gold',
  gradient: 'bg-brand-gradient',
};

export function ProgressBar({
  value,
  color = 'green',
  height = 8,
  showSheen = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const fillClass = colorMap[color];
  const inlineStyle = fillClass ? undefined : { background: color };

  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="w-full rounded-full bg-n-200 overflow-hidden relative"
        style={{ height }}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-[600ms] ease-out relative overflow-hidden',
            fillClass
          )}
          style={{ width: `${clamped}%`, ...inlineStyle }}
        >
          {showSheen && (
            <span
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sheen"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
