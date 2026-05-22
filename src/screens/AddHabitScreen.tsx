import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, fontFamily, radii, letterSpacing } from '../theme';
import { useHabitStore } from '../store/habitStore';

const EMOJIS = [
  '💧', '🧘', '📚', '🏃', '🎸',
  '🌱', '🍎', '✍️', '🏋️', '🎨',
  '💪', '🎯', '🧹', '💊', '🐕',
  '🌿', '🚴', '🧠', '🙏', '❤️',
];

const SPRING = { damping: 18, stiffness: 200 };

// ─── Emoji Tile ───────────────────────────────────────────────────────────────

interface EmojiTileProps {
  emoji: string;
  isSelected: boolean;
  onPress: (emoji: string) => void;
}

function EmojiTile({ emoji, isSelected, onPress }: EmojiTileProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.1, { damping: 12, stiffness: 220 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    }
  }, [isSelected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={() => onPress(emoji)} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.emojiTile,
          isSelected && styles.emojiTileSelected,
          animStyle,
        ]}
      >
        <Text style={styles.emojiTileText}>{emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onPress: (color: string) => void;
}

function ColorSwatch({ color, isSelected, onPress }: ColorSwatchProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.15 : 1, { damping: 12, stiffness: 220 });
  }, [isSelected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(colors.habitColors[0]);
  const [showError, setShowError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
    if (name.trim().length === 0) {
      setShowError(true);
      return;
    }
    saveScale.value = withSequence(
      withSpring(0.97, { damping: 12 }),
      withSpring(1, { damping: 12 }),
    );
    addHabit(name.trim(), selectedEmoji, selectedColor);
    close();
  }, [name, selectedEmoji, selectedColor, addHabit, close, saveScale]);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (showError && text.trim().length > 0) setShowError(false);
  }, [showError]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const isNameEmpty = name.trim().length === 0;

  return (
    <View style={styles.root}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
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
              {/* Text Input */}
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
                  {showError && (
                    <Text style={styles.errorText}>Please enter a habit name</Text>
                  )}
                </View>
                <Text style={styles.charCounter}>{name.length} / 40</Text>
              </View>

              {/* Emoji Section */}
              <Text style={styles.sectionLabel}>CHOOSE EMOJI</Text>
              <View style={styles.emojiGrid}>
                {EMOJIS.map((emoji) => (
                  <EmojiTile
                    key={emoji}
                    emoji={emoji}
                    isSelected={selectedEmoji === emoji}
                    onPress={setSelectedEmoji}
                  />
                ))}
              </View>

              {/* Color Section */}
              <Text style={styles.sectionLabel}>COLOR</Text>
              <View style={styles.colorRow}>
                {(colors.habitColors as readonly string[]).map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    isSelected={selectedColor === c}
                    onPress={setSelectedColor}
                  />
                ))}
              </View>

              {/* Save Button */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: colors.backdrop,
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.modalSurface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.inputBorder,
    borderRadius: radii.circle,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 28,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputSurface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocused,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    minHeight: 16,
  },
  inputMetaLeft: {
    flex: 1,
  },
  errorText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.error,
  },
  charCounter: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textLabel,
  },
  sectionLabel: {
    fontSize: fontSize.xxs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiTile: {
    width: 40,
    height: 40,
    borderRadius: radii.emojiTile,
    backgroundColor: colors.emojiTileBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.emojiTileSelectedBg,
  },
  emojiTileText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  swatchWrapper: {
    width: 24,
    height: 24,
    borderRadius: radii.circle,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchWrapperSelected: {
    borderColor: '#ffffff',
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: radii.circle,
  },
  saveButton: {
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: fontSize.saveButton,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: '#ffffff',
  },
});
