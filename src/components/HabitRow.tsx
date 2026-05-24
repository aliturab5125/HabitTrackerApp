import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Habit } from '../types';
import { colors, spacing, fontSize, fontFamily, radii } from '../theme';
import { getTodayISO, getCurrentStreak } from '../utils/dateUtils';
import { useHabitStore } from '../store/habitStore';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
  onPressHabit?: (id: string) => void;
}

export default function HabitRow({ habit, onToggle, onPressHabit }: Props) {
  const today = getTodayISO();
  const isCompleted = habit.completedDates.includes(today);
  const streak = getCurrentStreak(habit.completedDates);
  const hapticsEnabled = useHabitStore((s) => s.hapticsEnabled);

  const opacity = useSharedValue(isCompleted ? 0.55 : 1);
  const checkScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSpring(isCompleted ? 0.55 : 1, { damping: 15 });
  }, [isCompleted, opacity]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleToggle = useCallback(async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    checkScale.value = withSequence(
      withSpring(0.85, { damping: 12 }),
      withSpring(1.1, { damping: 12 }),
      withSpring(1, { damping: 15 }),
    );
    onToggle(habit.id, today);
  }, [habit.id, onToggle, checkScale, today]);

  const emojiCircleColor = habit.color + '33';

  const handlePress = useCallback(() => {
    onPressHabit?.(habit.id);
  }, [habit.id, onPressHabit]);

  return (
    <Animated.View style={[styles.row, animatedRowStyle]}>
      <Pressable
        onPress={handlePress}
        disabled={!onPressHabit}
        style={({ pressed }) => [styles.pressArea, pressed && styles.pressed]}
      >
        <View style={[styles.emojiCircle, { backgroundColor: emojiCircleColor }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>

        <View style={styles.middle}>
          <Text style={[styles.habitName, isCompleted && styles.strikethrough]}>
            {habit.name}
          </Text>
          <Text style={styles.streakLabel}>🔥 {streak} days</Text>
        </View>
      </Pressable>

      <TouchableOpacity onPress={handleToggle} hitSlop={8}>
        <Animated.View style={[styles.checkbox, isCompleted && styles.checkboxChecked, animatedCheckStyle]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.sm + spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm + spacing.xs,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  emojiCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: fontSize.emojiRow,
  },
  middle: {
    flex: 1,
  },
  habitName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  streakLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.circle,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
});
