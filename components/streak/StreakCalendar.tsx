'use client';

import { cn } from '@/lib/utils';
import type { Streak } from '@/types';

interface StreakCalendarProps {
  streak: Streak;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
  const days = getLast30Days();
  const activeSet = new Set(streak.activeDates);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-3xl font-black text-primary">{streak.currentDays}</span>
        <div>
          <p className="text-sm font-semibold text-navy">day streak 🔥</p>
          <p className="text-xs text-n-500">Longest: {streak.longestDays} days</p>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        aria-label="30-day activity calendar"
      >
        {days.map((date) => {
          const isActive = activeSet.has(date);
          const isToday = date === today;
          return (
            <div
              key={date}
              title={date}
              aria-label={`${date}${isActive ? ' — active' : ''}`}
              className={cn(
                'aspect-square rounded-sm',
                isActive
                  ? 'bg-primary'
                  : 'bg-n-200',
                isToday && !isActive && 'ring-1 ring-primary/50'
              )}
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-n-500">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-n-200" />
        <span>No activity</span>
        <span className="ml-2 inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
        <span>Active</span>
      </div>
    </div>
  );
}
