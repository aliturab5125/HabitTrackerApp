import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  radii,
  letterSpacing,
} from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Props {
  completedDays: number;
  totalDays: number;
}

export default function StatsHeroCard({ completedDays, totalDays }: Props) {
  const progress = totalDays > 0 ? completedDays / totalDays : 0;
  const percentage = Math.round(progress * 100);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progressValue.value),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.textColumn}>
        <Text style={styles.title}>THIS MONTH</Text>
        <Text style={styles.count}>
          {completedDays} / {totalDays}
        </Text>
        <Text style={styles.subtitle}>days completed</Text>
      </View>

      <View style={styles.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.statsArcTrack}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringLabel} pointerEvents="none">
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.statsHeroBg,
    borderWidth: 1,
    borderColor: colors.statsHeroBorder,
    borderRadius: radii.cardLg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.statsHeroTitle,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: fontSize.statsHero,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
