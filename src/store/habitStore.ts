import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';
import {
  getCurrentStreak as computeStreak,
  getCompletionRate as computeCompletionRate,
} from '../utils/dateUtils';

interface HabitState {
  habits: Habit[];

  // Preferences
  reminderEnabled: boolean;
  reminderTime: string;
  hapticsEnabled: boolean;

  // Habit actions
  addHabit: (name: string, emoji: string, color: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  getCompletionRate: (id: string, days: number) => number;
  getCurrentStreak: (id: string) => number;
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
          completedDates: [],
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
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
