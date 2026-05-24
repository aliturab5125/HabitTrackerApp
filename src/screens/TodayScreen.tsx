import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontFamily, radii, letterSpacing } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { getTodayISO, getCurrentStreak, getBestStreak } from '../utils/dateUtils';
import { Habit } from '../types';
import HabitRow from '../components/HabitRow';
import StreakCard from '../components/StreakCard';
import HabitActionSheet from '../components/HabitActionSheet';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── All-done toast ───────────────────────────────────────────────────────────

function AllDoneToast({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 1900 }),
        withTiming(0, { duration: 300 }),
      );
    }
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <Text style={styles.toastText}>All done today! 🎉</Text>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const navigation = useNavigation<NavProp>();
  const { habits, toggleHabitCompletion, incrementCount, decrementCount, deleteHabit, isCompletedToday } = useHabitStore();
  const today = getTodayISO();
  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const confettiRef = useRef<ConfettiCannon>(null);

  // Action sheet state
  const [actionSheetHabit, setActionSheetHabit] = useState<Habit | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);

  const completedToday = useMemo(
    () => habits.filter((h) => isCompletedToday(h)).length,
    [habits, isCompletedToday],
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

  const handleIncrement = useCallback(
    (id: string, date: string) => {
      incrementCount(id, date);
    },
    [incrementCount],
  );

  const handleDecrement = useCallback(
    (id: string, date: string) => {
      decrementCount(id, date);
    },
    [decrementCount],
  );

  // Check for 100% completion after every toggle
  const prevCompletedRef = useRef(completedToday);
  useEffect(() => {
    if (
      habits.length > 0 &&
      completedToday === habits.length &&
      prevCompletedRef.current < habits.length
    ) {
      confettiRef.current?.start();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
    prevCompletedRef.current = completedToday;
  }, [completedToday, habits.length]);

  const handlePressHabit = useCallback(
    (id: string) => {
      navigation.navigate('HabitDetail', { habitId: id });
    },
    [navigation],
  );

  const handleLongPressHabit = useCallback((habit: Habit) => {
    setActionSheetHabit(habit);
  }, []);

  const handleSwipeDelete = useCallback(
    (habit: Habit) => {
      swipeableRefs.current.get(habit.id)?.close();
      Alert.alert(
        `Delete "${habit.name}"?`,
        'This will remove all your history for this habit.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => swipeableRefs.current.get(habit.id)?.close(),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteHabit(habit.id),
          },
        ],
        { cancelable: true },
      );
    },
    [deleteHabit],
  );

  const handleActionSheetEdit = useCallback(
    (habitId: string) => {
      navigation.navigate('EditHabit', { habitId });
    },
    [navigation],
  );

  const handleActionSheetDelete = useCallback(
    (habitId: string) => {
      deleteHabit(habitId);
    },
    [deleteHabit],
  );

  const fabScale = useSharedValue(1);

  useEffect(() => {
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

  const renderRightActions = useCallback(
    (habit: Habit) => (
      <TouchableOpacity
        style={styles.swipeDeleteAction}
        onPress={() => handleSwipeDelete(habit)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ffffff" />
      </TouchableOpacity>
    ),
    [handleSwipeDelete],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={habits.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, Ali 👋</Text>
          <Text style={styles.subtitle}>
            {dateLabel} · {completedToday} of {habits.length} done
          </Text>
        </View>

        {/* Streak card */}
        {habits.length > 0 && (
          <StreakCard currentStreak={maxStreak} bestStreak={bestStreak} />
        )}

        {/* Habits section */}
        {habits.length > 0 && (
          <Text style={styles.sectionLabel}>HABITS</Text>
        )}

        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first habit</Text>
          </View>
        ) : (
          habits.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Swipeable
                ref={(ref) => {
                  if (ref) swipeableRefs.current.set(item.id, ref);
                  else swipeableRefs.current.delete(item.id);
                }}
                renderRightActions={() => renderRightActions(item)}
                rightThreshold={40}
                overshootRight={false}
              >
                <HabitRow
                  habit={item}
                  onToggle={handleToggle}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onPressHabit={handlePressHabit}
                  onLongPressHabit={handleLongPressHabit}
                />
              </Swipeable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fab, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => navigation.navigate('AddHabit')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Confetti */}
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={3000}
        explosionSpeed={350}
      />

      {/* All-done toast */}
      <AllDoneToast visible={showToast} />

      {/* Long-press action sheet */}
      {actionSheetHabit !== null && (
        <HabitActionSheet
          habit={actionSheetHabit}
          onClose={() => setActionSheetHabit(null)}
          onEdit={handleActionSheetEdit}
          onDelete={handleActionSheetDelete}
        />
      )}
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
    paddingTop: spacing.xl * 2,
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
  swipeDeleteAction: {
    width: 80,
    backgroundColor: '#1a0808',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.card,
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
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.modalSurface,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  toastText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
