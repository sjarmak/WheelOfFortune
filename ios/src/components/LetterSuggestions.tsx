/**
 * Letter Suggestions Component
 *
 * Shows suggested letters as big, tappable buttons.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { speakSuggestions, isTTSAvailable } from '../engine/tts';
import { colors, typography, spacing, borderRadius, shadows, layout } from '../styles/theme';

interface LetterSuggestionsProps {
  letters: string[];
  onSelect: (letter: string) => void;
  disabled?: boolean;
  title?: string;
  readAloudEnabled?: boolean;
  autoSpeak?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function LetterSuggestions({
  letters,
  onSelect,
  disabled = false,
  title = 'Try one of these!',
  readAloudEnabled = true,
  autoSpeak = false,
}: LetterSuggestionsProps): React.JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Auto-speak on mount
  useEffect(() => {
    if (autoSpeak && readAloudEnabled && isTTSAvailable() && letters.length > 0) {
      speakSuggestions(letters);
    }
  }, [autoSpeak, readAloudEnabled, letters]);

  const handleSelect = (letter: string, index: number) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIndex(index);
    setTimeout(() => {
      onSelect(letter);
      setSelectedIndex(null);
    }, 200);
  };

  if (letters.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.buttonRow}>
        {letters.map((letter, i) => (
          <LetterButton
            key={letter}
            letter={letter}
            index={i}
            disabled={disabled}
            selected={selectedIndex === i}
            onPress={() => handleSelect(letter, i)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

interface LetterButtonProps {
  letter: string;
  index: number;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}

function LetterButton({
  letter,
  index,
  disabled,
  selected,
  onPress,
}: LetterButtonProps): React.JSX.Element {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!disabled) {
      scale.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        )
      );
    }
  }, [disabled, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selected ? 1.1 : scale.value }],
  }));

  const buttonSize = layout.isSmallScreen ? 56 : 72;

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={
          disabled
            ? [colors.slate[500], colors.slate[600]]
            : selected
            ? [colors.green[400], colors.green[500]]
            : [colors.yellow[400], colors.orange[500]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { width: buttonSize, height: buttonSize }]}
      >
        <Text
          style={[
            styles.letter,
            disabled && styles.letterDisabled,
          ]}
        >
          {letter}
        </Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: spacing[2],
  },
  title: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.sm,
    marginBottom: spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  button: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  letter: {
    fontSize: layout.isSmallScreen ? typography.sizes['3xl'] : typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  letterDisabled: {
    color: colors.slate[400],
  },
});
