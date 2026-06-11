import { format, subDays, getDay } from 'date-fns';
import { Habit } from '../types';
import {
  getCurrentStreak,
  getBestStreak,
} from './dateUtils';

export function isHabitActiveOnDate(habit: Habit, date: Date): boolean {
  const activeDays = habit.activeDays;
  if (!activeDays || activeDays.length === 7) return true;
  return activeDays.includes(getDay(date));
}

export function isHabitDueToday(habit: Habit): boolean {
  return isHabitActiveOnDate(habit, new Date());
}

export function isHabitCompletedOnDate(habit: Habit, dateISO: string): boolean {
  const habitType = habit.habitType ?? 'boolean';
  if (habitType === 'count') {
    return (habit.countLog?.[dateISO] ?? 0) >= (habit.targetCount ?? 1);
  }
  return habit.completedDates.includes(dateISO);
}

/** All calendar dates where the habit met its daily goal. */
export function getHabitCompletionDates(habit: Habit): string[] {
  const dates = new Set<string>(habit.completedDates);

  if ((habit.habitType ?? 'boolean') === 'count' && habit.countLog) {
    const target = habit.targetCount ?? 1;
    for (const [date, count] of Object.entries(habit.countLog)) {
      if (count >= target) dates.add(date);
    }
  }

  return Array.from(dates);
}

export function getHabitCurrentStreak(habit: Habit): number {
  return getCurrentStreak(getHabitCompletionDates(habit), habit.activeDays);
}

export function getHabitBestStreak(habit: Habit): number {
  return getBestStreak(getHabitCompletionDates(habit));
}

/** Completion rate over the last `days` calendar days, counting only active weekdays. */
export function getHabitCompletionRate(habit: Habit, days: number): number {
  if (days <= 0) return 0;

  let activeDaysCount = 0;
  let completedCount = 0;

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), i);
    if (!isHabitActiveOnDate(habit, date)) continue;

    activeDaysCount++;
    const dateISO = format(date, 'yyyy-MM-dd');
    if (isHabitCompletedOnDate(habit, dateISO)) completedCount++;
  }

  if (activeDaysCount === 0) return 0;
  return Math.round((completedCount / activeDaysCount) * 100);
}

export interface TrendDay {
  label: string;
  dateISO: string;
  /** 0–1 bar height */
  value: number;
  completed: boolean;
  /** False on off-schedule weekdays */
  isScheduled: boolean;
}

export function getHabitTrendData(habit: Habit, days: number): TrendDay[] {
  const target = habit.targetCount ?? 1;
  const isCount = (habit.habitType ?? 'boolean') === 'count';
  const result: TrendDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateISO = format(date, 'yyyy-MM-dd');
    const label = format(date, days <= 7 ? 'EEE' : 'MMM d');
    const isScheduled = isHabitActiveOnDate(habit, date);

    if (!isScheduled) {
      result.push({ label, dateISO, value: 0, completed: false, isScheduled: false });
      continue;
    }

    if (isCount) {
      const count = habit.countLog?.[dateISO] ?? 0;
      result.push({
        label,
        dateISO,
        value: Math.min(count / target, 1),
        completed: count >= target,
        isScheduled: true,
      });
    } else {
      const completed = isHabitCompletedOnDate(habit, dateISO);
      result.push({
        label,
        dateISO,
        value: completed ? 1 : 0,
        completed,
        isScheduled: true,
      });
    }
  }

  return result;
}

/** Habits that should appear on the Today screen. */
export function getHabitsDueToday(habits: Habit[]): Habit[] {
  return habits.filter(isHabitDueToday);
}
