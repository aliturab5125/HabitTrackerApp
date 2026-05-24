import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, fontFamily, radii } from '../theme';

interface Props {
  currentStreak: number;
  bestStreak: number;
}

export default function StreakCard({ currentStreak, bestStreak }: Props) {
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

  return (
    <LinearGradient
      colors={[colors.streakCardStart, colors.streakCardEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.fireEmoji}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={styles.streakCount}>{displayedStreak} Day Streak</Text>
        <Text style={styles.bestStreak}>Keep it going! Best: {bestStreak} days</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.cardLg,
    borderWidth: 1,
    borderColor: colors.streakCardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  fireEmoji: {
    fontSize: fontSize.emoji,
  },
  textContainer: {
    flex: 1,
  },
  streakCount: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.streakAmber,
  },
  bestStreak: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.streakAmberMuted,
    marginTop: 2,
  },
});
