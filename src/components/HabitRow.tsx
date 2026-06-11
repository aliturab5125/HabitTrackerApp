import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Habit } from '../types';
import { colors, spacing, fontSize, fontFamily, radii } from '../theme';
import { getTodayISO } from '../utils/dateUtils';
import { getHabitCurrentStreak } from '../utils/habitUtils';
import { useHabitStore } from '../store/habitStore';

// ─── Count Ring (SVG) ─────────────────────────────────────────────────────────

const RING_SIZE = 32;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountRingProps {
  count: number;
  target: number;
  accentColor: string;
  isComplete: boolean;
}

function CountRing({ count, target, accentColor, isComplete }: CountRingProps) {
  const progress = useSharedValue(target > 0 ? count / target : 0);

  useEffect(() => {
    progress.value = withTiming(target > 0 ? count / target : 0, { duration: 300 });
  }, [count, target, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - Math.min(progress.value, 1)),
  }));

  const strokeColor = isComplete ? colors.success : accentColor;

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={strokeColor}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringCount, isComplete && styles.ringCountComplete]}>
          {count}
        </Text>
      </View>
    </View>
  );
}

// ─── Particle burst ───────────────────────────────────────────────────────────

const PARTICLE_ANGLES_DEG = [0, 60, 120, 180, 240, 300];
const PARTICLE_DIST = 22;

interface ParticleProps {
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  op: SharedValue<number>;
  color: string;
}

function Particle({ tx, ty, op, color }: ParticleProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: op.value,
  }));
  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

// ─── Animated Checkbox ────────────────────────────────────────────────────────

interface CheckboxProps {
  isCompleted: boolean;
  onPress: () => void;
  accentColor: string;
}

function AnimatedCheckbox({ isCompleted, onPress, accentColor }: CheckboxProps) {
  const checkScale = useSharedValue(1);
  const colorProgress = useSharedValue(isCompleted ? 1 : 0);
  const bgOpacity = useSharedValue(isCompleted ? 1 : 0);

  const p0tx = useSharedValue(0); const p0ty = useSharedValue(0); const p0op = useSharedValue(0);
  const p1tx = useSharedValue(0); const p1ty = useSharedValue(0); const p1op = useSharedValue(0);
  const p2tx = useSharedValue(0); const p2ty = useSharedValue(0); const p2op = useSharedValue(0);
  const p3tx = useSharedValue(0); const p3ty = useSharedValue(0); const p3op = useSharedValue(0);
  const p4tx = useSharedValue(0); const p4ty = useSharedValue(0); const p4op = useSharedValue(0);
  const p5tx = useSharedValue(0); const p5ty = useSharedValue(0); const p5op = useSharedValue(0);

  const particleTx = [p0tx, p1tx, p2tx, p3tx, p4tx, p5tx];
  const particleTy = [p0ty, p1ty, p2ty, p3ty, p4ty, p5ty];
  const particleOp = [p0op, p1op, p2op, p3op, p4op, p5op];

  useEffect(() => {
    colorProgress.value = withTiming(isCompleted ? 1 : 0, { duration: 200 });
    bgOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 200 });
  }, [isCompleted, colorProgress, bgOpacity]);

  const animateParticles = useCallback(() => {
    PARTICLE_ANGLES_DEG.forEach((deg, i) => {
      const rad = deg * (Math.PI / 180);
      particleTx[i].value = 0;
      particleTy[i].value = 0;
      particleOp[i].value = 1;
      particleTx[i].value = withTiming(Math.cos(rad) * PARTICLE_DIST, { duration: 300 });
      particleTy[i].value = withTiming(Math.sin(rad) * PARTICLE_DIST, { duration: 300 });
      particleOp[i].value = withTiming(0, { duration: 300 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerCheckAnimation = useCallback(() => {
    checkScale.value = withSequence(
      withSpring(0.85, { damping: 10 }),
      withSpring(1.2, { damping: 8 }),
      withSpring(1.0, { damping: 12 }),
    );
    if (!isCompleted) {
      runOnJS(animateParticles)();
    }
    onPress();
  }, [checkScale, isCompleted, animateParticles, onPress]);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.primary, colors.success],
    ),
  }));

  const checkboxBgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    backgroundColor: colors.success,
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.circle,
  }));

  return (
    <TouchableOpacity onPress={triggerCheckAnimation} hitSlop={8}>
      <View style={styles.checkboxContainer}>
        {particleTx.map((tx, i) => (
          <Particle key={i} tx={tx} ty={particleTy[i]} op={particleOp[i]} color={accentColor} />
        ))}
        <Animated.View style={[styles.checkbox, checkboxStyle]}>
          <Animated.View style={checkboxBgStyle} />
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Habit Row ────────────────────────────────────────────────────────────────

interface Props {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
  onIncrement?: (id: string, date: string) => void;
  onDecrement?: (id: string, date: string) => void;
  onPressHabit?: (id: string) => void;
  onLongPressHabit?: (habit: Habit) => void;
}

export default function HabitRow({
  habit,
  onToggle,
  onIncrement,
  onDecrement,
  onPressHabit,
  onLongPressHabit,
}: Props) {
  const today = getTodayISO();
  const isCompletedTodayFn = useHabitStore((s) => s.isCompletedToday);
  const isCompleted = isCompletedTodayFn(habit);
  const streak = getHabitCurrentStreak(habit);
  const hapticsEnabled = useHabitStore((s) => s.hapticsEnabled);

  const isCount = (habit.habitType ?? 'boolean') === 'count';
  const todayCount = isCount ? (habit.countLog?.[today] ?? 0) : 0;
  const target = habit.targetCount ?? 1;

  const opacity = useSharedValue(isCompleted ? 0.6 : 1);

  useEffect(() => {
    opacity.value = withSpring(isCompleted ? 0.6 : 1, { damping: 15 });
  }, [isCompleted, opacity]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleToggle = useCallback(async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle(habit.id, today);
  }, [habit.id, onToggle, today, hapticsEnabled]);

  const handleIncrement = useCallback(async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onIncrement?.(habit.id, today);
  }, [habit.id, onIncrement, today, hapticsEnabled]);

  const handleDecrement = useCallback(async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDecrement?.(habit.id, today);
  }, [habit.id, onDecrement, today, hapticsEnabled]);

  const handlePress = useCallback(() => {
    if (isCount) {
      handleIncrement();
    } else {
      onPressHabit?.(habit.id);
    }
  }, [isCount, handleIncrement, habit.id, onPressHabit]);

  const handleLongPress = useCallback(async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onLongPressHabit?.(habit);
  }, [habit, onLongPressHabit, hapticsEnabled]);

  const emojiCircleColor = habit.color + '33';

  return (
    <Animated.View style={[styles.row, animatedRowStyle]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={({ pressed }) => [styles.pressArea, pressed && styles.pressed]}
      >
        <View style={[styles.emojiCircle, { backgroundColor: emojiCircleColor }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>

        <View style={styles.middle}>
          <Text style={[styles.habitName, !isCount && isCompleted && styles.strikethrough]}>
            {habit.name}
          </Text>
          {isCount ? (
            <Text style={styles.streakLabel}>
              {todayCount} / {target}
            </Text>
          ) : (
            <Text style={styles.streakLabel}>🔥 {streak} days</Text>
          )}
        </View>
      </Pressable>

      {isCount ? (
        <View style={styles.countControls}>
          {todayCount > 0 && (
            <TouchableOpacity onPress={handleDecrement} hitSlop={8} style={styles.countBtn}>
              <Text style={styles.countBtnText}>−</Text>
            </TouchableOpacity>
          )}
          <CountRing
            count={todayCount}
            target={target}
            accentColor={habit.color}
            isComplete={isCompleted}
          />
        </View>
      ) : (
        <AnimatedCheckbox
          isCompleted={isCompleted}
          onPress={handleToggle}
          accentColor={habit.color}
        />
      )}
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
  // Count ring
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCount: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 13,
  },
  ringCountComplete: {
    color: colors.success,
  },
  countControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.inputSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  countBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: -1,
  },
  // Checkbox
  checkboxContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.circle,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
