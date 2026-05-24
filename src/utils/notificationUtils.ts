import * as Notifications from 'expo-notifications';
import type { PermissionResponse } from 'expo-modules-core';
import { Habit } from '../types';

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

export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  const ids: string[] = [];

  for (const timeStr of habit.reminderTimes) {
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1] ?? '0', 10);

    if (isNaN(hour) || isNaN(minute)) continue;

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
