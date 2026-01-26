/**
 * Kid Mode HUD Component
 *
 * Displays kid-friendly game status:
 * - Speak buttons for TTS
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { speakCategory, speakPuzzle, isTTSAvailable } from '../engine/tts';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface KidModeHUDProps {
  category: string;
  phrase: string;
  revealedPositions: number[];
  isSolved: boolean;
  readAloudEnabled: boolean;
}

export function KidModeHUD({
  category,
  phrase,
  revealedPositions,
  isSolved,
  readAloudEnabled,
}: KidModeHUDProps): React.JSX.Element | null {
  const ttsAvailable = isTTSAvailable();

  const handleSpeakCategory = () => {
    if (ttsAvailable && readAloudEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      speakCategory(category);
    }
  };

  const handleSpeakPuzzle = () => {
    if (ttsAvailable && readAloudEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      speakPuzzle(phrase, revealedPositions, isSolved);
    }
  };

  if (!ttsAvailable || !readAloudEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={handleSpeakCategory}
          style={[styles.button, styles.categoryButton]}
          activeOpacity={0.8}
        >
          <Volume2 size={12} color={colors.white} />
          <Text style={styles.buttonText}>Category</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSpeakPuzzle}
          style={[styles.button, styles.puzzleButton]}
          activeOpacity={0.8}
        >
          <Volume2 size={12} color={colors.white} />
          <Text style={styles.buttonText}>Puzzle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  categoryButton: {
    backgroundColor: colors.blue[500],
  },
  puzzleButton: {
    backgroundColor: colors.green[500],
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
