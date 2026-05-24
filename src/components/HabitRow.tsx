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
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Habit } from '../types';
import { colors, spacing, fontSize, fontFamily, radii } from '../theme';
import { getTodayISO, getCurrentStreak } from '../utils/dateUtils';
import { useHabitStore } from '../store/habitStore';

// ─── Particle burst angles (6 directions, every 60°) ─────────────────────────
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
  // Scale animation
  const checkScale = useSharedValue(1);
  // Color progress: 0 = unchecked, 1 = checked
  const colorProgress = useSharedValue(isCompleted ? 1 : 0);
  // Background opacity
  const bgOpacity = useSharedValue(isCompleted ? 1 : 0);

  // 6 particles
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
      const tx = particleTx[i];
      const ty = particleTy[i];
      const op = particleOp[i];
      tx.value = 0;
      ty.value = 0;
      op.value = 1;
      tx.value = withTiming(Math.cos(rad) * PARTICLE_DIST, { duration: 300 });
      ty.value = withTiming(Math.sin(rad) * PARTICLE_DIST, { duration: 300 });
      op.value = withTiming(0, { duration: 300 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerCheckAnimation = useCallback(() => {
    // 3-phase spring
    checkScale.value = withSequence(
      withSpring(0.85, { damping: 10 }),
      withSpring(1.2, { damping: 8 }),
      withSpring(1.0, { damping: 12 }),
    );
    // Particles fire on check (not uncheck)
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
        {/* Particles */}
        {particleTx.map((tx, i) => (
          <Particle
            key={i}
            tx={tx}
            ty={particleTy[i]}
            op={particleOp[i]}
            color={accentColor}
          />
        ))}

        {/* Checkbox */}
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
  onPressHabit?: (id: string) => void;
  onLongPressHabit?: (habit: Habit) => void;
}

export default function HabitRow({ habit, onToggle, onPressHabit, onLongPressHabit }: Props) {
  const today = getTodayISO();
  const isCompletedToday = useHabitStore((s) => s.isCompletedToday);
  const isCompleted = isCompletedToday(habit);
  const streak = getCurrentStreak(habit.completedDates);
  const hapticsEnabled = useHabitStore((s) => s.hapticsEnabled);

  const opacity = useSharedValue(isCompleted ? 0.55 : 1);

  useEffect(() => {
    opacity.value = withSpring(isCompleted ? 0.55 : 1, { damping: 15 });
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

  const handlePress = useCallback(() => {
    onPressHabit?.(habit.id);
  }, [habit.id, onPressHabit]);

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
        disabled={!onPressHabit && !onLongPressHabit}
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

      <AnimatedCheckbox
        isCompleted={isCompleted}
        onPress={handleToggle}
        accentColor={habit.color}
      />
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
  // Checkbox container provides positioning context for particles
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
