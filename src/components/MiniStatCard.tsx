import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  radii,
} from '../theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  icon: IconName;
  value: string | number;
  label: string;
  index: number;
}

export default function MiniStatCard({ icon, value, label, index }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={styles.card}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={colors.primary}
        style={styles.icon}
      />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.input,
    padding: spacing.sm + spacing.xs,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.statsMini,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  label: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
});
