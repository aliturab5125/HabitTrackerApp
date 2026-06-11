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
  getHabitCurrentStreak,
  getHabitCompletionRate,
  getHabitTrendData,
} from '../utils/habitUtils';
import HabitTrendChart from './HabitTrendChart';

const TREND_DAYS = 7;
const CHART_HEIGHT = 48;

interface Props {
  habit: Habit;
}

export default function HabitPerformanceCard({ habit }: Props) {
  const streak = useMemo(() => getHabitCurrentStreak(habit), [habit]);
  const completionRate = useMemo(
    () => getHabitCompletionRate(habit, 30),
    [habit],
  );
  const trendData = useMemo(() => getHabitTrendData(habit, TREND_DAYS), [habit]);

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

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>30-day rate</Text>
        <Text style={styles.rateValue}>{completionRate}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressFillStyle]} />
      </View>

      <HabitTrendChart
        data={trendData}
        accentColor={habit.color}
        barHeight={CHART_HEIGHT}
        title="LAST 7 DAYS"
      />
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
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rateLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  rateValue: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.statsProgressTrack,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
