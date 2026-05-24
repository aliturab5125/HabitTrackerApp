import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontFamily, radii } from '../theme';
import { Habit } from '../types';

interface Props {
  habit: Habit;
  onClose: () => void;
  onEdit: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

const SPRING = { damping: 22, stiffness: 260 };

export default function HabitActionSheet({ habit, onClose, onEdit, onDelete }: Props) {
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, SPRING);
  }, [backdropOpacity, translateY]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 180 });
    translateY.value = withSpring(400, SPRING, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, backdropOpacity, translateY]);

  const handleEdit = useCallback(() => {
    close();
    // Small delay so sheet animates out before navigation
    setTimeout(() => onEdit(habit.id), 220);
  }, [close, onEdit, habit.id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      `Delete "${habit.name}"?`,
      'This will remove all your history for this habit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            close();
            setTimeout(() => onDelete(habit.id), 220);
          },
        },
      ],
      { cancelable: true },
    );
  }, [close, onDelete, habit.id, habit.name]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Habit identity */}
        <View style={styles.identity}>
          <View style={[styles.identityEmoji, { backgroundColor: habit.color + '44' }]}>
            <Text style={styles.identityEmojiText}>{habit.emoji}</Text>
          </View>
          <Text style={styles.identityName} numberOfLines={1}>{habit.name}</Text>
        </View>

        <View style={styles.divider} />

        {/* Edit row */}
        <TouchableOpacity style={styles.actionRow} onPress={handleEdit} activeOpacity={0.7}>
          <View style={styles.actionIconWrapper}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textPrimary} />
          </View>
          <Text style={styles.actionLabel}>Edit habit</Text>
        </TouchableOpacity>

        {/* Delete row */}
        <TouchableOpacity style={styles.actionRow} onPress={handleDelete} activeOpacity={0.7}>
          <View style={styles.actionIconWrapper}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.deleteText} />
          </View>
          <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Delete habit</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelButton} onPress={close} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.backdrop,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.modalSurface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.inputBorder,
    borderRadius: radii.circle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  identityEmoji: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityEmojiText: {
    fontSize: 22,
  },
  identityName: {
    flex: 1,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
  },
  actionIconWrapper: {
    width: 28,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  actionLabelDanger: {
    color: colors.deleteText,
  },
  cancelButton: {
    height: 48,
    borderRadius: radii.pillLg,
    backgroundColor: colors.inputSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cancelText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
