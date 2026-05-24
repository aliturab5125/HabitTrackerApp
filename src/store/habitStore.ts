import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';
import {
  getCurrentStreak as computeStreak,
  getCompletionRate as computeCompletionRate,
  getTodayISO,
} from '../utils/dateUtils';

interface HabitState {
  habits: Habit[];

  // Preferences
  reminderEnabled: boolean;
  reminderTime: string;
  hapticsEnabled: boolean;

  // Habit actions
  addHabit: (name: string, emoji: string, color: string) => void;
  editHabit: (id: string, name: string, emoji: string, color: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  getCompletionRate: (id: string, days: number) => number;
  getCurrentStreak: (id: string) => number;
  isCompletedToday: (habit: Habit) => boolean;
  resetAll: () => void;

  // Preference setters
  setReminderEnabled: (val: boolean) => void;
  setReminderTime: (val: string) => void;
  setHapticsEnabled: (val: boolean) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      reminderEnabled: false,
      reminderTime: '8:00 AM',
      hapticsEnabled: true,

      addHabit: (name, emoji, color) => {
        const newHabit: Habit = {
          id: Date.now().toString(),
          name,
          emoji,
          color,
          createdAt: new Date().toISOString(),
          habitType: 'boolean',
          targetCount: 1,
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          reminderTimes: [],
          completedDates: [],
          countLog: {},
          notificationIds: [],
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      editHabit: (id, name, emoji, color) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, name, emoji, color } : h
          ),
        }));
      },

      deleteHabit: (id) => {
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

      getCompletionRate: (id, days) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return 0;
        return computeCompletionRate(habit.completedDates, days);
      },

      getCurrentStreak: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return 0;
        return computeStreak(habit.completedDates);
      },

      isCompletedToday: (habit) => {
        const today = getTodayISO();
        const habitType = habit.habitType ?? 'boolean';
        if (habitType === 'count') {
          return (habit.countLog?.[today] ?? 0) >= (habit.targetCount ?? 1);
        }
        return habit.completedDates.includes(today);
      },

      resetAll: () => {
        set({ habits: [] });
      },

      setReminderEnabled: (val) => set({ reminderEnabled: val }),
      setReminderTime: (val) => set({ reminderTime: val }),
      setHapticsEnabled: (val) => set({ hapticsEnabled: val }),
    }),
    {
      name: 'habit-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
