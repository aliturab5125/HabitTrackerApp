import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, fontFamily, radii, letterSpacing } from '../theme';
import { useHabitStore, NewHabitParams } from '../store/habitStore';
import { formatReminderTime } from '../utils/dateUtils';
import { HabitType } from '../types';

const EMOJIS = [
  '💧', '🧘', '📚', '🏃', '🎸',
  '🌱', '🍎', '✍️', '🏋️', '🎨',
  '💪', '🎯', '🧹', '💊', '🐕',
  '🌿', '🚴', '🧠', '🙏', '❤️',
];

const SPRING = { damping: 18, stiffness: 200 };
const MAX_REMINDERS = 5;

// Day labels: Sun=0, Mon=1 … Sat=6 — displayed as M T W T F S S (Mon-first)
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun in display order → actual JS getDay() values

// ─── Sub-components ───────────────────────────────────────────────────────────

interface EmojiTileProps { emoji: string; isSelected: boolean; onPress: (e: string) => void; }
function EmojiTile({ emoji, isSelected, onPress }: EmojiTileProps) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withSpring(isSelected ? 1.1 : 1, { damping: 12, stiffness: 220 }); }, [isSelected, scale]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={() => onPress(emoji)} activeOpacity={0.7}>
      <Animated.View style={[styles.emojiTile, isSelected && styles.emojiTileSelected, animStyle]}>
        <Text style={styles.emojiTileText}>{emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface ColorSwatchProps { color: string; isSelected: boolean; onPress: (c: string) => void; }
function ColorSwatch({ color, isSelected, onPress }: ColorSwatchProps) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withSpring(isSelected ? 1.15 : 1, { damping: 12, stiffness: 220 }); }, [isSelected, scale]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={() => onPress(color)} activeOpacity={0.7}>
      <Animated.View style={[styles.swatchWrapper, isSelected && styles.swatchWrapperSelected, animStyle]}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddHabitScreen() {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { addHabit } = useHabitStore();

  // Basic fields
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(colors.habitColors[0]);
  const [showError, setShowError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Habit type
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [targetCount, setTargetCount] = useState('1');

  // Active days (all selected by default: 0=Sun … 6=Sat)
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Reminders
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Animations
  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);
  const saveScale = useSharedValue(1);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, SPRING);
  }, [backdropOpacity, translateY]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(height, SPRING, (finished) => {
      if (finished) runOnJS(goBack)();
    });
  }, [height, goBack, backdropOpacity, translateY]);

  const handleSave = useCallback(() => {
    saveScale.value = withSequence(
      withSpring(0.97, { damping: 12 }),
      withSpring(1, { damping: 12 }),
    );
    if (name.trim().length === 0) {
      setShowError(true);
      return;
    }
    const parsedTarget = parseInt(targetCount, 10);
    const params: NewHabitParams = {
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      habitType,
      targetCount: isNaN(parsedTarget) || parsedTarget < 1 ? 1 : parsedTarget,
      activeDays,
      reminderTimes,
    };
    addHabit(params);
    close();
  }, [name, selectedEmoji, selectedColor, habitType, targetCount, activeDays, reminderTimes, addHabit, close, saveScale]);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (showError && text.trim().length > 0) setShowError(false);
  }, [showError]);

  const toggleDay = useCallback((day: number) => {
    setActiveDays((prev) =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter((d) => d !== day) : prev // keep at least 1
        : [...prev, day]
    );
  }, []);

  const handleTimePickerChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowTimePicker(false);
      if (date) {
        setPickerDate(date);
        if (Platform.OS === 'android') {
          const hh = String(date.getHours()).padStart(2, '0');
          const mm = String(date.getMinutes()).padStart(2, '0');
          const timeStr = `${hh}:${mm}`;
          if (!reminderTimes.includes(timeStr) && reminderTimes.length < MAX_REMINDERS) {
            setReminderTimes((prev) => [...prev, timeStr]);
          }
        }
      }
    },
    [reminderTimes],
  );

  const confirmIOSTimePicker = useCallback(() => {
    setShowTimePicker(false);
    const hh = String(pickerDate.getHours()).padStart(2, '0');
    const mm = String(pickerDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    if (!reminderTimes.includes(timeStr) && reminderTimes.length < MAX_REMINDERS) {
      setReminderTimes((prev) => [...prev, timeStr]);
    }
  }, [pickerDate, reminderTimes]);

  const removeReminder = useCallback((time: string) => {
    setReminderTimes((prev) => prev.filter((t) => t !== time));
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const saveButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));
  const isNameEmpty = name.trim().length === 0;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.headerSpacer} />
              <Text style={styles.headerTitle}>New Habit</Text>
              <TouchableOpacity style={styles.closeButton} onPress={close} hitSlop={8}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Name */}
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                placeholder="e.g. Drink water"
                placeholderTextColor={colors.textLabel}
                value={name}
                onChangeText={handleNameChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={40}
                returnKeyType="done"
                selectionColor={colors.primary}
              />
              <View style={styles.inputMeta}>
                <View style={styles.inputMetaLeft}>
                  {showError && <Text style={styles.errorText}>Please enter a habit name</Text>}
                </View>
                <Text style={styles.charCounter}>{name.length} / 40</Text>
              </View>

              {/* Habit type */}
              <Text style={styles.sectionLabel}>HABIT TYPE</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, habitType === 'boolean' && styles.typeBtnActive]}
                  onPress={() => setHabitType('boolean')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeBtnText, habitType === 'boolean' && styles.typeBtnTextActive]}>
                    ✓  Daily check
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, habitType === 'count' && styles.typeBtnActive]}
                  onPress={() => setHabitType('count')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeBtnText, habitType === 'count' && styles.typeBtnTextActive]}>
                    #  Count target
                  </Text>
                </TouchableOpacity>
              </View>

              {habitType === 'count' && (
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Daily target</Text>
                  <TextInput
                    style={styles.targetInput}
                    value={targetCount}
                    onChangeText={setTargetCount}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectionColor={colors.primary}
                  />
                </View>
              )}

              {/* Emoji */}
              <Text style={styles.sectionLabel}>CHOOSE EMOJI</Text>
              <View style={styles.emojiGrid}>
                {EMOJIS.map((emoji) => (
                  <EmojiTile key={emoji} emoji={emoji} isSelected={selectedEmoji === emoji} onPress={setSelectedEmoji} />
                ))}
              </View>

              {/* Color */}
              <Text style={styles.sectionLabel}>COLOR</Text>
              <View style={styles.colorRow}>
                {(colors.habitColors as readonly string[]).map((c) => (
                  <ColorSwatch key={c} color={c} isSelected={selectedColor === c} onPress={setSelectedColor} />
                ))}
              </View>

              {/* Active days */}
              <Text style={styles.sectionLabel}>REPEAT</Text>
              <View style={styles.daysRow}>
                {DAY_ORDER.map((dayValue, idx) => {
                  const isActive = activeDays.includes(dayValue);
                  return (
                    <TouchableOpacity
                      key={dayValue}
                      style={[styles.dayPill, isActive && styles.dayPillActive]}
                      onPress={() => toggleDay(dayValue)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                        {DAY_LABELS[idx]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Reminders */}
              <Text style={styles.sectionLabel}>REMINDERS</Text>

              {reminderTimes.map((t) => (
                <View key={t} style={styles.reminderPill}>
                  <Text style={styles.reminderPillTime}>{formatReminderTime(t)}</Text>
                  <TouchableOpacity onPress={() => removeReminder(t)} hitSlop={8}>
                    <Text style={styles.reminderPillRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {reminderTimes.length < MAX_REMINDERS && (
                <TouchableOpacity style={styles.addReminderRow} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
                  <Text style={styles.addReminderIcon}>+</Text>
                  <Text style={styles.addReminderText}>Add a time</Text>
                </TouchableOpacity>
              )}

              {habitType === 'count' && (
                <Text style={styles.reminderNote}>You can add multiple reminders per day</Text>
              )}

              {/* Time picker — Android modal */}
              {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimePickerChange}
                />
              )}

              {/* Save */}
              <Animated.View style={saveButtonStyle}>
                <TouchableOpacity
                  style={[styles.saveButton, isNameEmpty && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveButtonText}>Save Habit</Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* iOS time picker modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerSheet}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosPickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIOSTimePicker}>
                  <Text style={styles.iosPickerDone}>Add</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleTimePickerChange}
                textColor={colors.textPrimary}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.backdrop },
  sheetContainer: { width: '100%' },
  sheet: {
    backgroundColor: colors.modalSurface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '92%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: colors.inputBorder,
    borderRadius: radii.circle,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: { width: 28 },
  headerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, fontWeight: '700', color: colors.textPrimary },
  closeButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.sm },
  input: {
    backgroundColor: colors.inputSurface, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: fontSize.md, fontFamily: fontFamily.regular, color: colors.textPrimary,
  },
  inputFocused: { borderColor: colors.inputBorderFocused },
  inputMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs, marginBottom: spacing.xs, minHeight: 16,
  },
  inputMetaLeft: { flex: 1 },
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, color: colors.error },
  charCounter: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, color: colors.textLabel },
  sectionLabel: {
    fontSize: fontSize.xxs, fontFamily: fontFamily.semiBold, fontWeight: '600',
    color: colors.textMuted, letterSpacing: letterSpacing.wide, textTransform: 'uppercase',
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  // Habit type
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radii.input,
    backgroundColor: colors.inputSurface, borderWidth: 1, borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.emojiTileSelectedBg, borderColor: colors.primary },
  typeBtnText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, fontWeight: '500', color: colors.textMuted },
  typeBtnTextActive: { color: colors.textPrimary },
  targetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.inputSurface, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 10,
  },
  targetLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, color: colors.textPrimary },
  targetInput: {
    fontSize: fontSize.md, fontFamily: fontFamily.bold, fontWeight: '700',
    color: colors.primary, textAlign: 'right', minWidth: 48,
  },
  // Emoji
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiTile: {
    width: 40, height: 40, borderRadius: radii.emojiTile,
    backgroundColor: colors.emojiTileBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiTileSelected: { borderColor: colors.primary, backgroundColor: colors.emojiTileSelectedBg },
  emojiTileText: { fontSize: 20 },
  // Color
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
  swatchWrapper: {
    width: 24, height: 24, borderRadius: radii.circle, borderWidth: 2,
    borderColor: 'transparent', alignItems: 'center', justifyContent: 'center',
  },
  swatchWrapperSelected: { borderColor: '#ffffff' },
  swatch: { width: 20, height: 20, borderRadius: radii.circle },
  // Active days
  daysRow: { flexDirection: 'row', gap: 6 },
  dayPill: {
    flex: 1, paddingVertical: 8, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.inputBorder,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, fontWeight: '700', color: colors.textMuted },
  dayPillTextActive: { color: '#ffffff' },
  // Reminders
  reminderPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.inputSurface, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  reminderPillTime: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, fontWeight: '600', color: colors.textPrimary },
  reminderPillRemove: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600', paddingLeft: spacing.sm },
  addReminderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10,
  },
  addReminderIcon: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  addReminderText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, fontWeight: '500', color: colors.primary },
  reminderNote: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, color: colors.textMuted, fontStyle: 'italic' },
  // Save
  saveButton: {
    height: 48, borderRadius: radii.pillLg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: fontSize.saveButton, fontFamily: fontFamily.bold, fontWeight: '700', color: '#ffffff' },
  // iOS time picker
  iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop },
  iosPickerSheet: {
    backgroundColor: colors.modalSurface,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
    paddingBottom: spacing.xl,
  },
  iosPickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.inputBorder,
  },
  iosPickerCancel: { fontSize: fontSize.md, fontFamily: fontFamily.medium, color: colors.textMuted },
  iosPickerDone: { fontSize: fontSize.md, fontFamily: fontFamily.bold, fontWeight: '700', color: colors.primary },
  iosPicker: { backgroundColor: colors.modalSurface },
});
