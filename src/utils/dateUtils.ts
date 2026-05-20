import { format, subDays } from 'date-fns';

export interface HeatmapCell {
  date: string;
  completed: boolean;
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Counts consecutive completed days ending on today or yesterday.
 * If neither today nor yesterday is completed, streak is 0.
 */
export function getCurrentStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const dateSet = new Set(completedDates);

  const mostRecentDate = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
  if (!mostRecentDate) return 0;

  let streak = 0;
  let daysBack = mostRecentDate === today ? 0 : 1;

  while (dateSet.has(format(subDays(new Date(), daysBack), 'yyyy-MM-dd'))) {
    streak++;
    daysBack++;
  }

  return streak;
}

/**
 * Returns the percentage (0–100) of the last `days` days that are completed.
 */
export function getCompletionRate(completedDates: string[], days: number): number {
  if (days <= 0) return 0;

  const dateSet = new Set(completedDates);
  let completedCount = 0;

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (dateSet.has(date)) completedCount++;
  }

  return Math.round((completedCount / days) * 100);
}

/**
 * Returns a 2D array [week][day] of HeatmapCells for the last `weeks` weeks.
 * Week 0 is the oldest; the last week contains today.
 * Each week has 7 days ordered from oldest (index 0) to newest (index 6).
 */
export function getHeatmapData(completedDates: string[], weeks: number): HeatmapCell[][] {
  if (weeks <= 0) return [];

  const dateSet = new Set(completedDates);
  const totalDays = weeks * 7;
  const result: HeatmapCell[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const daysAgo = totalDays - 1 - (w * 7 + d);
      const date = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
      week.push({ date, completed: dateSet.has(date) });
    }
    result.push(week);
  }

  return result;
}
