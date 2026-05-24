import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  radii,
  letterSpacing,
} from '../theme';
import { useHabitStore } from '../store/habitStore';
import {
  getCurrentStreak,
  getBestStreak,
  getCalendarHeatmap,
} from '../utils/dateUtils';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HabitDetail'>;
type Route = RouteProp<RootStackParamList, 'HabitDetail'>;

const HEATMAP_WEEKS = 12;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_RADIUS = 3;
const DAY_LABEL_WIDTH = 16;
const LABEL_FONT_SIZE = 9;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const GRID_WIDTH = HEATMAP_WEEKS * (CELL_SIZE + CELL_GAP) - CELL_GAP;

interface StatPillProps {
  value: string | number;
  label: string;
}

function StatPill({ value, label }: StatPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export default function HabitDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { habitId } = route.params;

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === habitId));
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  useEffect(() => {
    if (!habit) navigation.goBack();
  }, [habit, navigation]);

  const currentStreak = useMemo(
    () => (habit ? getCurrentStreak(habit.completedDates) : 0),
    [habit],
  );

  const bestStreak = useMemo(
    () => (habit ? getBestStreak(habit.completedDates) : 0),
    [habit],
  );

  const heatmap = useMemo(
    () => (habit ? getCalendarHeatmap(habit.completedDates, HEATMAP_WEEKS) : []),
    [habit],
  );

  const streakAnim = useSharedValue(0);
  const [displayedStreak, setDisplayedStreak] = useState(0);

  useAnimatedReaction(
    () => Math.round(streakAnim.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayedStreak)(current);
      }
    },
  );

  useEffect(() => {
    streakAnim.value = 0;
    streakAnim.value = withTiming(currentStreak, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStreak, streakAnim]);

  const handleDelete = useCallback(() => {
    if (!habit) return;
    Alert.alert(
      'Delete habit?',
      'This will remove all your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
            deleteHabit(habit.id);
          },
        },
      ],
      { cancelable: true },
    );
  }, [habit, deleteHabit, navigation]);

  if (!habit) return null;

  const startedLabel = format(parseISO(habit.createdAt), 'MMM d');
  const totalDone = habit.completedDates.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={goBack}
            hitSlop={12}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <View style={styles.ringOuter}>
            <Text style={styles.ringEmoji}>{habit.emoji}</Text>
          </View>

          <Text style={styles.habitName}>{habit.name}</Text>

          <Text style={styles.streakText}>🔥 {displayedStreak}</Text>
        </View>

        <View style={styles.pillsRow}>
          <StatPill value={bestStreak} label="Best Streak" />
          <StatPill value={totalDone} label="Total Done" />
          <StatPill value={startedLabel} label="Started" />
        </View>

        <Text style={styles.sectionLabel}>COMPLETION HISTORY</Text>

        <View style={styles.heatmapContainer}>
          <View style={styles.monthLabelsRow}>
            <View style={{ width: DAY_LABEL_WIDTH + CELL_GAP }} />
            <View style={styles.monthLabelsTrack}>
              {heatmap.map((week, w) => {
                const month = format(parseISO(week[0].date), 'MMM');
                const prevMonth =
                  w > 0
                    ? format(parseISO(heatmap[w - 1][0].date), 'MMM')
                    : null;
                const showLabel = w === 0 || month !== prevMonth;
                if (!showLabel) return null;
                return (
                  <Text
                    key={`m-${w}`}
                    style={[
                      styles.monthLabel,
                      { left: w * (CELL_SIZE + CELL_GAP) },
                    ]}
                  >
                    {month}
                  </Text>
                );
              })}
            </View>
          </View>

          <View style={styles.heatmapBody}>
            <View style={styles.dayLabelsCol}>
              {DAY_LABELS.map((label, i) => (
                <View key={`d-${i}`} style={styles.dayLabelCell}>
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.weeksRow}>
              {heatmap.map((week, w) => (
                <View key={`w-${w}`} style={styles.weekCol}>
                  {week.map((cell, d) => (
                    <Animated.View
                      key={`c-${w}-${d}`}
                      entering={FadeIn.delay((w * 7 + d) * 8).duration(200)}
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
        </View>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.deleteButtonText}>Delete Habit</Text>
        </Pressable>
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
    paddingBottom: spacing.xl,
  },
  headerBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: radii.circle,
    backgroundColor: colors.detailRingBg,
    borderWidth: 2,
    borderColor: colors.detailRingBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  ringEmoji: {
    fontSize: fontSize.detailEmoji,
  },
  habitName: {
    fontSize: fontSize.detailHabitName,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm + 4,
    textAlign: 'center',
  },
  streakText: {
    fontSize: fontSize.detailStreak,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.streakAmber,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pill: {
    backgroundColor: colors.detailPillBg,
    borderWidth: 1,
    borderColor: colors.detailPillBorder,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  pillValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: letterSpacing.label,
    textTransform: 'uppercase',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heatmapContainer: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthLabelsTrack: {
    width: GRID_WIDTH,
    height: LABEL_FONT_SIZE + 4,
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: fontFamily.regular,
    color: colors.textLabel,
  },
  heatmapBody: {
    flexDirection: 'row',
  },
  dayLabelsCol: {
    width: DAY_LABEL_WIDTH,
    marginRight: CELL_GAP,
    gap: CELL_GAP,
  },
  dayLabelCell: {
    height: CELL_SIZE,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: LABEL_FONT_SIZE,
    fontFamily: fontFamily.regular,
    color: colors.textLabel,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekCol: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
  },
  deleteButton: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.deleteBorder,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: colors.deleteText,
  },
});
