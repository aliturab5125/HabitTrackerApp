import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitType } from '../types';
import { getTodayISO } from '../utils/dateUtils';
import {
  getHabitCurrentStreak,
  getHabitCompletionRate,
  isHabitCompletedOnDate,
} from '../utils/habitUtils';
import {
  scheduleHabitReminders,
  cancelHabitReminders,
  scheduleGlobalReminder,
} from '../utils/notificationUtils';

export interface NewHabitParams {
  name: string;
  emoji: string;
  color: string;
  habitType: HabitType;
  targetCount: number;
  activeDays: number[];
  reminderTimes: string[];
}

interface HabitState {
  habits: Habit[];

  // Preferences
  reminderEnabled: boolean;
  reminderTime: string;
  globalNotificationId: string | null;
  hapticsEnabled: boolean;

  // Habit actions
  addHabit: (params: NewHabitParams) => void;
  editHabit: (id: string, params: NewHabitParams) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  incrementCount: (id: string, date: string) => void;
  decrementCount: (id: string, date: string) => void;
  getCompletionRate: (id: string, days: number) => number;
  getCurrentStreak: (id: string) => number;
  isCompletedToday: (habit: Habit) => boolean;
  resetAll: () => void;

  // Preference setters
  setReminderEnabled: (val: boolean) => void;
  setReminderTime: (val: string) => void;
  setHapticsEnabled: (val: boolean) => void;
  syncGlobalReminder: () => void;
}

async function applyGlobalReminder(
  enabled: boolean,
  time: string,
  existingId: string | null,
): Promise<string | null> {
  if (existingId) {
    await cancelHabitReminders([existingId]);
  }
  if (!enabled) return null;
  return scheduleGlobalReminder(time);
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      reminderEnabled: false,
      reminderTime: '08:00',
      globalNotificationId: null,
      hapticsEnabled: true,

      addHabit: (params) => {
        const newHabit: Habit = {
          id: Date.now().toString(),
          name: params.name,
          emoji: params.emoji,
          color: params.color,
          createdAt: new Date().toISOString(),
          habitType: params.habitType,
          targetCount: params.targetCount,
          activeDays: params.activeDays,
          reminderTimes: params.reminderTimes,
          completedDates: [],
          countLog: {},
          notificationIds: [],
        };

        scheduleHabitReminders(newHabit).then((ids) => {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === newHabit.id ? { ...h, notificationIds: ids } : h
            ),
          }));
        });

        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      editHabit: (id, params) => {
        const existing = get().habits.find((h) => h.id === id);

        if (existing) {
          cancelHabitReminders(existing.notificationIds ?? []).then(() => {
            const updated: Habit = {
              ...existing,
              name: params.name,
              emoji: params.emoji,
              color: params.color,
              habitType: params.habitType,
              targetCount: params.targetCount,
              activeDays: params.activeDays,
              reminderTimes: params.reminderTimes,
            };
            scheduleHabitReminders(updated).then((ids) => {
              set((state) => ({
                habits: state.habits.map((h) =>
                  h.id === id ? { ...updated, notificationIds: ids } : h
                ),
              }));
            });
          });
        }

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  name: params.name,
                  emoji: params.emoji,
                  color: params.color,
                  habitType: params.habitType,
                  targetCount: params.targetCount,
                  activeDays: params.activeDays,
                  reminderTimes: params.reminderTimes,
                }
              : h
          ),
        }));
      },

      deleteHabit: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (habit) {
          cancelHabitReminders(habit.notificationIds ?? []);
        }
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      toggleHabitCompletion: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const habitType = h.habitType ?? 'boolean';
            if (habitType === 'count') {
              const current = h.countLog?.[date] ?? 0;
              const target = h.targetCount ?? 1;
              const next = current >= target ? 0 : current + 1;
              return { ...h, countLog: { ...h.countLog, [date]: next } };
            }
            const alreadyCompleted = h.completedDates.includes(date);
            return {
              ...h,
              completedDates: alreadyCompleted
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            };
          }),
        }));
      },

      incrementCount: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const current = h.countLog?.[date] ?? 0;
            const target = h.targetCount ?? 1;
            if (current >= target) return h;
            return { ...h, countLog: { ...h.countLog, [date]: current + 1 } };
          }),
        }));
      },

      decrementCount: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const current = h.countLog?.[date] ?? 0;
            if (current <= 0) return h;
            return { ...h, countLog: { ...h.countLog, [date]: current - 1 } };
          }),
        }));
      },

      getCompletionRate: (id, days) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return 0;
        return getHabitCompletionRate(habit, days);
      },

      getCurrentStreak: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return 0;
        return getHabitCurrentStreak(habit);
      },

      isCompletedToday: (habit) => {
        return isHabitCompletedOnDate(habit, getTodayISO());
      },

      resetAll: () => {
        const { habits, globalNotificationId } = get();
        habits.forEach((h) => cancelHabitReminders(h.notificationIds ?? []));
        if (globalNotificationId) {
          cancelHabitReminders([globalNotificationId]);
        }
        set({ habits: [], globalNotificationId: null });
      },

      setReminderEnabled: (val) => {
        const { reminderTime, globalNotificationId } = get();
        applyGlobalReminder(val, reminderTime, globalNotificationId).then((id) => {
          set({ reminderEnabled: val, globalNotificationId: id });
        });
      },

      setReminderTime: (val) => {
        const { reminderEnabled, globalNotificationId } = get();
        applyGlobalReminder(reminderEnabled, val, globalNotificationId).then((id) => {
          set({ reminderTime: val, globalNotificationId: id });
        });
      },

      setHapticsEnabled: (val) => set({ hapticsEnabled: val }),

      syncGlobalReminder: () => {
        const { reminderEnabled, reminderTime, globalNotificationId } = get();
        if (!reminderEnabled) return;
        applyGlobalReminder(true, reminderTime, globalNotificationId).then((id) => {
          set({ globalNotificationId: id });
        });
      },
    }),
    {
      name: 'habit-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
