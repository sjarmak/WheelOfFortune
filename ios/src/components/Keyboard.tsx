/**
 * Keyboard Component
 *
 * Virtual keyboard for letter selection.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from "react-native-reanimated";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
} from "../styles/theme";

interface KeyboardProps {
  guessedLetters: string[];
  onGuess: (letter: string) => void;
  onAlreadyCalled?: (letter: string) => void;
  disabled: boolean;
  vowelsOnly?: boolean;
  consonantsOnly?: boolean;
  highlightVowels?: boolean;
  hideGuessedLetters?: boolean;
  large?: boolean;
  selectedLetters?: string[];
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const VOWELS = ["A", "E", "I", "O", "U"];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface KeyProps {
  char: string;
  isGuessed: boolean;
  isVowel: boolean;
  isAllowed: boolean;
  isSelected: boolean;
  vowelHighlight: boolean;
  large: boolean;
  onPress: () => void;
}

function Key({
  char,
  isGuessed,
  isVowel,
  isAllowed,
  isSelected,
  vowelHighlight,
  large,
  onPress,
}: KeyProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Pulse animation for highlighted vowels
  React.useEffect(() => {
    if (vowelHighlight) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [vowelHighlight, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (!isAllowed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const keySize = large
    ? {
        width: layout.isSmallScreen ? 32 : 40,
        height: layout.isSmallScreen ? 40 : 48,
      }
    : {
        width: layout.isSmallScreen ? 28 : 32,
        height: layout.isSmallScreen ? 36 : 42,
      };

  if (vowelHighlight) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.keyBase, keySize, animatedStyle]}
      >
        <LinearGradient
          colors={[colors.yellow[300], colors.orange[500]]}
          style={[styles.keyGradient, keySize, styles.highlighted]}
        >
          <Text
            style={[
              styles.keyText,
              large && styles.keyTextLarge,
              styles.highlightedText,
            ]}
          >
            {char}
          </Text>
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  if (isSelected) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.keyBase, keySize, styles.keySelected, animatedStyle]}
      >
        <Text
          style={[
            styles.keyText,
            large && styles.keyTextLarge,
            styles.keyTextSelected,
          ]}
        >
          {char}
        </Text>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={!isAllowed}
      activeOpacity={0.8}
      style={[
        styles.keyBase,
        keySize,
        isGuessed
          ? styles.keyGuessed
          : isAllowed
            ? styles.keyAvailable
            : styles.keyDisabled,
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          large && styles.keyTextLarge,
          isGuessed
            ? styles.keyTextGuessed
            : isAllowed
              ? styles.keyTextAvailable
              : styles.keyTextDisabled,
        ]}
      >
        {char}
      </Text>
    </AnimatedTouchable>
  );
}

export function Keyboard({
  guessedLetters,
  onGuess,
  onAlreadyCalled,
  disabled,
  vowelsOnly = false,
  consonantsOnly = false,
  highlightVowels = false,
  hideGuessedLetters = false,
  large = false,
  selectedLetters = [],
}: KeyboardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.container,
        large ? styles.containerLarge : styles.containerCompact,
      ]}
    >
      {ROWS.map((row, i) => (
        <View
          key={i}
          style={[styles.row, large ? styles.rowLarge : styles.rowCompact]}
        >
          {row.map((char) => {
            const isGuessed = guessedLetters.includes(char);
            const isVowel = VOWELS.includes(char);
            const isSelected = selectedLetters.includes(char);

            // In hide mode, guessed letters look available but trigger onAlreadyCalled
            const visuallyGuessed = hideGuessedLetters ? false : isGuessed;

            let isAllowed = !disabled;
            if (!hideGuessedLetters && isGuessed && !isSelected)
              isAllowed = false;
            if (vowelsOnly && !isVowel) isAllowed = false;
            if (consonantsOnly && isVowel) isAllowed = false;
            // Selected letters are always tappable (for deselection)
            if (isSelected) isAllowed = true;

            const vowelHighlight =
              highlightVowels && isVowel && !isGuessed && !disabled;

            const handlePress = () => {
              if (hideGuessedLetters && isGuessed && onAlreadyCalled) {
                onAlreadyCalled(char);
              } else {
                onGuess(char);
              }
            };

            return (
              <Key
                key={char}
                char={char}
                isGuessed={isSelected ? false : visuallyGuessed}
                isVowel={isVowel}
                isAllowed={isAllowed}
                isSelected={isSelected}
                vowelHighlight={vowelHighlight}
                large={large}
                onPress={handlePress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  containerLarge: {
    gap: spacing[2],
  },
  containerCompact: {
    gap: spacing[1],
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  rowLarge: {
    gap: spacing[2],
  },
  rowCompact: {
    gap: spacing[1],
  },
  keyBase: {
    borderRadius: borderRadius.base,
    alignItems: "center",
    justifyContent: "center",
  },
  keyGradient: {
    borderRadius: borderRadius.base,
    alignItems: "center",
    justifyContent: "center",
  },
  keyAvailable: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  keyGuessed: {
    backgroundColor: colors.slate[700],
    opacity: 0.5,
  },
  keyDisabled: {
    backgroundColor: colors.slate[800],
    opacity: 0.5,
  },
  keySelected: {
    backgroundColor: colors.green[500],
    ...shadows.md,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: colors.yellow[200],
    ...shadows.lg,
  },
  keyText: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  keyTextLarge: {
    fontSize: typography.sizes.lg,
  },
  keyTextAvailable: {
    color: colors.slate[900],
  },
  keyTextGuessed: {
    color: colors.slate[500],
  },
  keyTextDisabled: {
    color: colors.slate[600],
  },
  keyTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  highlightedText: {
    color: colors.black,
  },
});
