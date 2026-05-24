export type HabitType = 'boolean' | 'count'

export type Habit = {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  habitType: HabitType          // boolean = simple check, count = repeatable
  targetCount: number           // 1 for boolean habits, N for countable
  activeDays: number[]          // [0,1,2,3,4,5,6] = all days, [1,3,5] = Mon/Wed/Fri
  reminderTimes: string[]       // ["08:00", "13:00"] — per-habit reminders
  completedDates: string[]      // for boolean habits
  countLog: Record<string, number>  // for count habits: { "2025-05-20": 5 }
  notificationIds: string[]     // expo notification IDs to cancel on delete/edit
}