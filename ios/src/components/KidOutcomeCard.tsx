/**
 * Kid Outcome Card Component
 *
 * Displays wheel outcomes in a fun, animated card.
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
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Type, Target, Star, Lightbulb, Gift, Sparkles, DollarSign } from 'lucide-react-native';
import { KidWedgeOutcome } from '../engine/kidTypes';
import { speakOutcome, isTTSAvailable } from '../engine/tts';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface KidOutcomeCardProps {
  outcome: KidWedgeOutcome;
  onDismiss: () => void;
  readAloudEnabled: boolean;
}

const outcomeMessages: Record<string, string[]> = {
  GUESS_ANY: ['Your turn!', 'Pick a letter!', 'Guess time!'],
  GUESS_TWO: ['Two guesses!', 'Double fun!', 'Pick two!'],
  VOWEL_PLUS: ['Vowel plus!', 'Special turn!', 'Two picks!'],
  PICK_THREE: ['Choose one!', 'Pick from 3!', 'Your choice!'],
  FREE_LETTER: ['Free letter!', 'Lucky you!', 'Surprise!'],
  BONUS_STAR: ['Star time!', 'Bonus star!', 'Yay!'],
  HINT_TOKEN: ['Free hint!', 'Hint power!', 'Lucky you!'],
  MONEY: ['You win cash!', 'Money time!', 'Ka-ching!'],
};

const outcomeIcons: Record<KidWedgeOutcome['type'], typeof Star> = {
  GUESS_ANY: Type,
  GUESS_TWO: Type,
  VOWEL_PLUS: Sparkles,
  PICK_THREE: Target,
  FREE_LETTER: Gift,
  BONUS_STAR: Star,
  HINT_TOKEN: Lightbulb,
  MONEY: DollarSign,
};

export function KidOutcomeCard({
  outcome,
  onDismiss,
  readAloudEnabled,
}: KidOutcomeCardProps): React.JSX.Element {
  const [message, setMessage] = useState('');
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pick random message
    const messages = outcomeMessages[outcome.type] || ['Great!'];
    setMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Speak outcome
    if (readAloudEnabled && isTTSAvailable()) {
      speakOutcome(outcome.label, outcome.emoji);
    }

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, [outcome, readAloudEnabled]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const IconComponent = outcomeIcons[outcome.type] ?? Star;

  return (
    <TouchableOpacity onPress={onDismiss} activeOpacity={0.9} style={styles.touchable}>
      <LinearGradient
        colors={[colors.purple[600], colors.pink[500], colors.orange[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View entering={ZoomIn.duration(300)}>
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <IconComponent size={64} color={colors.white} />
          </Animated.View>

          {/* Label */}
          <Animated.Text
            entering={FadeIn.delay(100).duration(200)}
            style={styles.label}
          >
            {outcome.label}
          </Animated.Text>

          {/* Message */}
          <Animated.Text
            entering={FadeIn.delay(200).duration(200)}
            style={styles.message}
          >
            {message}
          </Animated.Text>

          {/* Star indicator for bonus stars */}
          {outcome.type === 'BONUS_STAR' && (
            <Animated.View
              entering={FadeIn.delay(300).duration(200)}
              style={styles.starRow}
            >
              {Array.from({ length: outcome.value }).map((_, i) => (
                <Star key={i} size={24} color={colors.yellow[200]} fill={colors.yellow[200]} />
              ))}
            </Animated.View>
          )}

          {/* Tap hint */}
          <Text style={styles.tapHint}>Tap to continue</Text>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    ...shadows.xl,
  },
  gradient: {
    padding: spacing[6],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing[2],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: typography.sizes.xl,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing[4],
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tapHint: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing[2],
  },
});
