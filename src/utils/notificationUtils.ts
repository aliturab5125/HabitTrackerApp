import * as Notifications from 'expo-notifications';
import type { PermissionResponse } from 'expo-modules-core';
import { Habit } from '../types';

/** Parses "08:00" or "8:00 AM" into 24h hour/minute. */
export function parseReminderTime(timeStr: string): { hour: number; minute: number } | null {
  const trimmed = timeStr.trim();

  const match24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (period === 'AM') {
      if (hour === 12) hour = 0;
    } else if (hour !== 12) {
      hour += 12;
    }
    return { hour, minute };
  }

  return null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = (await Notifications.getPermissionsAsync()) as unknown as PermissionResponse;
  if (existing.granted) return true;
  const result = (await Notifications.requestPermissionsAsync()) as unknown as PermissionResponse;
  return result.granted;
}

export async function scheduleGlobalReminder(timeStr: string): Promise<string | null> {
  const parsed = parseReminderTime(timeStr);
  if (!parsed) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HabitFlow',
        body: 'Time to check in on your habits!',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });
  } catch {
    return null;
  }
}

export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  const ids: string[] = [];

  for (const timeStr of habit.reminderTimes) {
    const parsed = parseReminderTime(timeStr);
    if (!parsed) continue;
    const { hour, minute } = parsed;

    const body =
      habit.habitType === 'count'
        ? `Tap to log your progress (0 / ${habit.targetCount})`
        : 'Time to check off your habit!';

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji} ${habit.name}`,
          body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
    } catch {
      // Swallow scheduling errors (e.g. simulator without notification support)
    }
  }

  return ids;
}

export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Ignore if already cancelled
    }
  }
}
