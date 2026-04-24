import type { Streak, StreakMilestoneInfo } from '@/types';

export const MILESTONES: StreakMilestoneInfo[] = [
  { days: 7, label: '1 Week Warrior', reward: 100 },
  { days: 14, label: '2 Week Champion', reward: 250 },
  { days: 30, label: 'Monthly Master', reward: 500 },
  { days: 60, label: 'Bimonthly Legend', reward: 1000 },
  { days: 100, label: 'Century Club', reward: 2000 },
];

/** Returns yesterday's date as YYYY-MM-DD (UTC) relative to a given date */
function previousDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Advance a streak by recording activity on `activityDate`.
 * - If activity is already logged for that date: no-op.
 * - If activity was the day after lastActivityDate: increment.
 * - Otherwise: reset to 1.
 */
export function advanceStreak(streak: Streak, activityDate: string): Streak {
  const { lastActivityDate, currentDays, longestDays, activeDates } = streak;

  if (lastActivityDate === activityDate) return streak;

  const yesterday = previousDay(activityDate);
  const newDays = lastActivityDate === yesterday ? currentDays + 1 : 1;

  const newActiveDates = [...activeDates, activityDate].slice(-30);

  return {
    ...streak,
    currentDays: newDays,
    longestDays: Math.max(longestDays, newDays),
    lastActivityDate: activityDate,
    activeDates: newActiveDates,
  };
}

/**
 * Check if the given day count hits a milestone.
 */
export function getMilestone(days: number): StreakMilestoneInfo | null {
  return MILESTONES.find((m) => m.days === days) ?? null;
}

/**
 * Determine whether a streak is still alive (last activity was today or yesterday).
 */
export function isStreakAlive(streak: Streak, today: string): boolean {
  if (!streak.lastActivityDate) return false;
  const yesterday = previousDay(today);
  return (
    streak.lastActivityDate === today ||
    streak.lastActivityDate === yesterday
  );
}
