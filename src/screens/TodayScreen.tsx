import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontFamily, radii, letterSpacing } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { getTodayISO, getCurrentStreak, getBestStreak } from '../utils/dateUtils';
import { Habit } from '../types';
import HabitRow from '../components/HabitRow';
import StreakCard from '../components/StreakCard';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const navigation = useNavigation<NavProp>();
  const { habits, toggleHabitCompletion } = useHabitStore();
  const today = getTodayISO();
  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  const completedToday = useMemo(
    () => habits.filter((h) => h.completedDates.includes(today)).length,
    [habits, today],
  );

  const maxStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => getCurrentStreak(h.completedDates)));
  }, [habits]);

  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => getBestStreak(h.completedDates)));
  }, [habits]);

  const handleToggle = useCallback(
    (id: string, date: string) => {
      toggleHabitCompletion(id, date);
    },
    [toggleHabitCompletion],
  );

  const fabScale = useSharedValue(1);

  React.useEffect(() => {
    if (habits.length === 0) {
      fabScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
        false,
      );
    } else {
      fabScale.value = withTiming(1);
    }
  }, [habits.length, fabScale]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Habit>) => (
      <HabitRow habit={item} onToggle={handleToggle} />
    ),
    [handleToggle],
  );

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, Ali 👋
          </Text>
          <Text style={styles.subtitle}>
            {dateLabel} · {completedToday} of {habits.length} done
          </Text>
        </View>

        {habits.length > 0 && (
          <StreakCard currentStreak={maxStreak} bestStreak={bestStreak} />
        )}

        {habits.length > 0 && (
          <Text style={styles.sectionLabel}>HABITS</Text>
        )}
      </>
    ),
    [dateLabel, completedToday, habits.length, maxStreak, bestStreak],
  );

  const ListEmptyComponent = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtext}>Tap + to add your first habit</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={habits.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[styles.fab, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => navigation.navigate('AddHabit')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: letterSpacing.label,
    textTransform: 'uppercase',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
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
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    shadowColor: colors.fabShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: fontSize.emojiFab,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -1,
  },
});
