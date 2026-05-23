import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Habit } from '../types';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  radii,
} from '../theme';
import {
  getCurrentStreak,
  getCompletionRate,
  getHeatmapData,
} from '../utils/dateUtils';

const HEATMAP_WEEKS = 10;
const CELL_SIZE = 10;
const CELL_GAP = 2;
const CELL_RADIUS = 2;
const PROGRESS_BAR_HEIGHT = 4;

interface Props {
  habit: Habit;
}

export default function HabitPerformanceCard({ habit }: Props) {
  const streak = useMemo(
    () => getCurrentStreak(habit.completedDates),
    [habit.completedDates],
  );
  const completionRate = useMemo(
    () => getCompletionRate(habit.completedDates, 30),
    [habit.completedDates],
  );
  const heatmap = useMemo(
    () => getHeatmapData(habit.completedDates, HEATMAP_WEEKS),
    [habit.completedDates],
  );

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(completionRate / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [completionRate, progress]);

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const emojiBgColor = habit.color + '33';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.emojiCircle, { backgroundColor: emojiBgColor }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={styles.streak}>🔥 {streak}</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressFillStyle]} />
      </View>

      <View style={styles.heatmap}>
        {heatmap.map((week, wIdx) => (
          <View key={`w-${wIdx}`} style={styles.heatmapColumn}>
            {week.map((cell, dIdx) => (
              <View
                key={`c-${wIdx}-${dIdx}`}
                style={[
                  styles.cell,
                  cell.completed
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.heatmapEmpty },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.statsHabitCardBg,
    borderWidth: 1,
    borderColor: colors.statsHabitCardBorder,
    borderRadius: radii.emojiTile,
    padding: spacing.sm + 2,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emojiCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 14,
  },
  name: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  streak: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: colors.statsProgressTrack,
    borderRadius: PROGRESS_BAR_HEIGHT,
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: PROGRESS_BAR_HEIGHT,
  },
  heatmap: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  heatmapColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
  },
});
