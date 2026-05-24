import {
  format,
  subDays,
  parseISO,
  differenceInCalendarDays,
  startOfWeek,
  subWeeks,
  addDays,
  getDay,
} from 'date-fns';

export interface HeatmapCell {
  date: string;
  completed: boolean;
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Counts consecutive completed active-days ending on today (or yesterday if
 * today is not yet completed). A "missed" day only breaks the streak when that
 * weekday is in activeDays and completedDates doesn't contain it.
 * When activeDays is omitted all 7 days are considered active.
 */
export function getCurrentStreak(
  completedDates: string[],
  activeDays?: number[],
): number {
  const allDaysActive = !activeDays || activeDays.length === 7;
  const dateSet = new Set(completedDates);

  let streak = 0;
  let daysBack = 0;
  const today = new Date();

  // Walk backwards day by day from today
  while (true) {
    const candidateDate = subDays(today, daysBack);
    const candidateISO = format(candidateDate, 'yyyy-MM-dd');
    const weekday = getDay(candidateDate); // 0=Sun … 6=Sat

    const isActiveDay = allDaysActive || (activeDays?.includes(weekday) ?? false);

    if (isActiveDay) {
      if (dateSet.has(candidateISO)) {
        streak++;
      } else {
        // Allow today to be incomplete without breaking the streak only for
        // the very first iteration (streak is still 0).
        if (daysBack === 0 && streak === 0) {
          daysBack++;
          continue;
        }
        break;
      }
    }
    // Inactive days are skipped — they don't increment or break the streak.
    daysBack++;

    // Safety limit: don't walk back more than 5 years
    if (daysBack > 365 * 5) break;
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
 * Returns the all-time best (longest) streak from the full date history.
 */
export function getBestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sorted = [...completedDates].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]));
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else if (diff > 1) {
      current = 1;
    }
  }

  return best;
}

/**
 * Returns a 2D array [week][day] of HeatmapCells for the last `weeks` weeks.
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

/**
 * Returns `weeks` columns × 7 rows of HeatmapCells aligned to Monday-start
 * calendar weeks.
 */
export function getCalendarHeatmap(
  completedDates: string[],
  weeks: number,
): HeatmapCell[][] {
  if (weeks <= 0) return [];

  const dateSet = new Set(completedDates);
  const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const firstMonday = subWeeks(thisMonday, weeks - 1);

  const result: HeatmapCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = addDays(firstMonday, w * 7 + d);
      const dateStr = format(cellDate, 'yyyy-MM-dd');
      week.push({ date: dateStr, completed: dateSet.has(dateStr) });
    }
    result.push(week);
  }

  return result;
}

/** Formats a "HH:MM" 24h string to "8:00 AM" display format. */
export function formatReminderTime(hhmm: string): string {
  const [hourStr, minuteStr] = hhmm.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}
