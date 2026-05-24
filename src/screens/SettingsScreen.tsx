import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontFamily, radii, letterSpacing } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { Habit } from '../types';

// ─── Inline Toggle ────────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

function Toggle({ value, onValueChange }: ToggleProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        true: colors.success,
        false: colors.settingsToggleTrackOff,
      }}
      thumbColor={colors.background}
      ios_backgroundColor={colors.settingsToggleTrackOff}
    />
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

interface SectionLabelProps {
  title: string;
  danger?: boolean;
}

function SectionLabel({ title, danger = false }: SectionLabelProps) {
  return (
    <Text
      style={[
        styles.sectionLabel,
        danger && styles.sectionLabelDanger,
      ]}
    >
      {title}
    </Text>
  );
}

// ─── Preference Row ───────────────────────────────────────────────────────────

interface PrefRowProps {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  label: React.ReactNode;
  right: React.ReactNode;
  indented?: boolean;
}

function PrefRow({ iconName, iconColor, label, right, indented = false }: PrefRowProps) {
  return (
    <View style={[styles.prefRow, indented && styles.prefRowIndented]}>
      {!indented ? (
        <MaterialCommunityIcons name={iconName} size={18} color={iconColor} style={styles.prefIcon} />
      ) : (
        <View style={styles.prefIconPlaceholder} />
      )}
      <View style={styles.prefLabelContainer}>
        {typeof label === 'string' ? (
          <Text style={styles.prefLabel}>{label}</Text>
        ) : (
          label
        )}
      </View>
      <View style={styles.prefRight}>{right}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const habits = useHabitStore((s) => s.habits);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const resetAll = useHabitStore((s) => s.resetAll);
  const reminderEnabled = useHabitStore((s) => s.reminderEnabled);
  const reminderTime = useHabitStore((s) => s.reminderTime);
  const hapticsEnabled = useHabitStore((s) => s.hapticsEnabled);
  const setReminderEnabled = useHabitStore((s) => s.setReminderEnabled);
  const setHapticsEnabled = useHabitStore((s) => s.setHapticsEnabled);

  const handleDeleteHabit = useCallback(
    (habit: Habit) => {
      Alert.alert(
        `Delete "${habit.name}"?`,
        'This will remove all your history for this habit.',
        [
          { text: 'Cancel', style: 'cancel' },
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

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear all data?',
      'This will delete all habits and history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => resetAll(),
        },
      ],
      { cancelable: true },
    );
  }, [resetAll]);

  const renderHabitRow = useCallback(
    ({ item }: ListRenderItemInfo<Habit>) => (
      <View style={styles.habitRow}>
        <View style={[styles.habitEmojiCircle, { backgroundColor: item.color + '55' }]}>
          <Text style={styles.habitEmoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.habitName} numberOfLines={1}>{item.name}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteHabit(item)}
          hitSlop={8}
          style={styles.trashButton}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.deleteText} />
        </TouchableOpacity>
      </View>
    ),
    [handleDeleteHabit],
  );

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.heading}>Settings</Text>

      <FlatList
        data={habits}
        keyExtractor={keyExtractor}
        renderItem={renderHabitRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          habits.length > 0 ? (
            <SectionLabel title="MY HABITS" />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyHabitsRow}>
            <SectionLabel title="MY HABITS" />
            <Text style={styles.emptyHabitsText}>No habits yet</Text>
          </View>
        }
        ListFooterComponent={
          <>
            <SectionLabel title="PREFERENCES" />

            {/* Daily reminder */}
            <PrefRow
              iconName="bell-outline"
              iconColor={colors.primary}
              label="Daily reminder"
              right={
                <Toggle value={reminderEnabled} onValueChange={setReminderEnabled} />
              }
            />

            {/* Reminder time — visible only when reminder is ON */}
            {reminderEnabled && (
              <PrefRow
                iconName="bell-outline"
                iconColor={colors.primary}
                label={<Text style={styles.prefLabelMuted}>Reminder time</Text>}
                right={
                  <View style={styles.reminderTimeRight}>
                    <Text style={styles.reminderTimeText}>{reminderTime}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color={colors.primary} />
                  </View>
                }
                indented
              />
            )}

            {/* Haptic feedback */}
            <PrefRow
              iconName="vibrate"
              iconColor={colors.primary}
              label="Haptic feedback"
              right={
                <Toggle value={hapticsEnabled} onValueChange={setHapticsEnabled} />
              }
            />

            <SectionLabel title="DANGER ZONE" danger />

            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllRow} activeOpacity={0.7}>
              <Text style={styles.clearAllText}>Clear All Data</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>HabitFlow v1.0.0</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: letterSpacing.label,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionLabelDanger: {
    color: colors.settingsDangerLabel,
  },

  // Habit rows
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.settingsHabitRowBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: spacing.sm,
  },
  habitEmojiCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 16,
  },
  habitName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  trashButton: {
    padding: 4,
  },

  // Empty habits
  emptyHabitsRow: {
    marginBottom: spacing.sm,
  },
  emptyHabitsText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  // Preference rows
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.settingsHabitRowBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: spacing.sm,
  },
  prefRowIndented: {
    paddingLeft: 20,
  },
  prefIcon: {
    width: 22,
    textAlign: 'center',
  },
  prefIconPlaceholder: {
    width: 22,
  },
  prefLabelContainer: {
    flex: 1,
  },
  prefLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  prefLabelMuted: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  prefRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Reminder time right section
  reminderTimeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderTimeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.primary,
  },

  // Danger zone
  clearAllRow: {
    backgroundColor: colors.settingsHabitRowBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    color: colors.deleteText,
  },

  // Version
  versionText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.settingsVersionText,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
