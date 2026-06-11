import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  format,
  subDays,
  getDaysInMonth,
} from 'date-fns';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  letterSpacing,
} from '../theme';
import { useHabitStore } from '../store/habitStore';
import {
  getHabitCurrentStreak,
  getHabitCompletionRate,
  isHabitCompletedOnDate,
  isHabitActiveOnDate,
} from '../utils/habitUtils';
import StatsHeroCard from '../components/StatsHeroCard';
import MiniStatCard from '../components/MiniStatCard';
import HabitPerformanceCard from '../components/HabitPerformanceCard';
import LastFourteenDaysChart, {
  type DailyDatum,
} from '../components/LastFourteenDaysChart';

const LAST_N_DAYS = 14;

export default function StatsScreen() {
  const { habits } = useHabitStore();
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.md * 2;

  const monthStats = useMemo(() => {
    const now = new Date();
    const daysInMonth = getDaysInMonth(now);
    const completedDaysSet = new Set<string>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      if (date > now) break;

      const dateISO = format(date, 'yyyy-MM-dd');
      const anyCompleted = habits.some(
        (h) => isHabitActiveOnDate(h, date) && isHabitCompletedOnDate(h, dateISO),
      );
      if (anyCompleted) completedDaysSet.add(dateISO);
    }

    return { completedDays: completedDaysSet.size, daysInMonth };
  }, [habits]);

  const doneToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return habits.filter((h) => isHabitCompletedOnDate(h, today)).length;
  }, [habits]);

  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => getHabitCurrentStreak(h)));
  }, [habits]);

  const avgRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const total = habits.reduce(
      (sum, h) => sum + getHabitCompletionRate(h, 30),
      0,
    );
    return Math.round(total / habits.length);
  }, [habits]);

  const last14: DailyDatum[] = useMemo(() => {
    const result: DailyDatum[] = [];
    for (let i = LAST_N_DAYS - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE');
      const count = habits.reduce((sum, h) => {
        if (!isHabitActiveOnDate(h, date)) return sum;
        return sum + (isHabitCompletedOnDate(h, dateStr) ? 1 : 0);
      }, 0);
      result.push({ label, value: count });
    }
    return result;
  }, [habits]);

  if (habits.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Nothing to chart yet</Text>
          <Text style={styles.emptySubtext}>
            Add a habit and check back as you build streaks.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StatsHeroCard
          completedDays={monthStats.completedDays}
          totalDays={monthStats.daysInMonth}
        />

        <View style={styles.miniGrid}>
          <View style={styles.miniRow}>
            <MiniStatCard
              icon="format-list-checks"
              value={habits.length}
              label="Total Habits"
              index={0}
            />
            <MiniStatCard
              icon="check-circle-outline"
              value={doneToday}
              label="Done Today"
              index={1}
            />
          </View>
          <View style={styles.miniRow}>
            <MiniStatCard
              icon="fire"
              value={bestStreak}
              label="Best Streak"
              index={2}
            />
            <MiniStatCard
              icon="percent-outline"
              value={`${avgRate}%`}
              label="Avg. Rate"
              index={3}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>HABIT PERFORMANCE</Text>
        {habits.map((habit) => (
          <HabitPerformanceCard key={habit.id} habit={habit} />
        ))}

        <LastFourteenDaysChart data={last14} chartWidth={chartWidth} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  miniGrid: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  miniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: letterSpacing.label,
    textTransform: 'uppercase',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyEmoji: {
    fontSize: fontSize.emojiEmpty,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
