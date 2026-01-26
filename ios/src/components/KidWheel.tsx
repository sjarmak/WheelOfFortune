/**
 * Kid-Friendly Wheel Component
 *
 * A colorful, animated wheel with positive outcomes only.
 * Uses react-native-svg and react-native-reanimated.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { KidWedgeOutcome, KID_WHEEL_CONFIG } from '../engine/kidTypes';
import { getKidWheelOutcome } from '../engine/kidGame';
import { getShopItem } from '../engine/shopTypes';
import { colors, shadows } from '../styles/theme';

interface KidWheelProps {
  onSpinStart: () => void;
  onSpinComplete: (outcome: KidWedgeOutcome) => void;
  isSpinning: boolean;
  seed: number;
  canSpin: boolean;
  wheelThemeId?: string | null;
}

const WEDGE_COUNT = KID_WHEEL_CONFIG.length;
const WEDGE_ANGLE = 360 / WEDGE_COUNT;
const SPIN_DURATION = 4000;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function KidWheel({
  onSpinStart,
  onSpinComplete,
  seed,
  canSpin,
  wheelThemeId,
}: KidWheelProps): React.JSX.Element {
  const [isAnimating, setIsAnimating] = useState(false);
  const rotation = useSharedValue(0);
  const startY = useRef(0);

  // Get custom wheel colors from equipped theme
  const themeColors = wheelThemeId ? getShopItem(wheelThemeId)?.wheelColors : null;

  const completeSpinCallback = useCallback((outcome: KidWedgeOutcome) => {
    setIsAnimating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSpinComplete(outcome);
  }, [onSpinComplete]);

  const handleSpin = useCallback(() => {
    if (!canSpin || isAnimating) return;

    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSpinStart();

    // Get deterministic outcome
    const outcome = getKidWheelOutcome(seed);
    const outcomeIndex = KID_WHEEL_CONFIG.indexOf(outcome);

    // Calculate rotation to land on this wedge
    const baseRotation = 360 * 5; // 5 full spins
    const wedgeRotation = outcomeIndex * WEDGE_ANGLE;
    const finalRotation = rotation.value + baseRotation + (360 - wedgeRotation) + (WEDGE_ANGLE / 2);

    // Animate with tick sounds
    const tickInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 150);

    rotation.value = withTiming(finalRotation, {
      duration: SPIN_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(clearInterval)(tickInterval);
        runOnJS(completeSpinCallback)(outcome);
      }
    });

    // Clear tick sounds after spin completes
    setTimeout(() => clearInterval(tickInterval), SPIN_DURATION);
  }, [canSpin, isAnimating, onSpinStart, seed, rotation, completeSpinCallback]);

  // Swipe gesture for spinning
  const swipeGesture = Gesture.Pan()
    .onBegin((e) => {
      startY.current = e.absoluteY;
    })
    .onEnd((e) => {
      const deltaY = startY.current - e.absoluteY;
      if (Math.abs(deltaY) > 50 && canSpin && !isAnimating) {
        runOnJS(handleSpin)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Generate wedge paths
  const wedges = KID_WHEEL_CONFIG.map((wedge, i) => {
    const startAngle = i * WEDGE_ANGLE;
    const endAngle = startAngle + WEDGE_ANGLE;
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = 100 + 95 * Math.cos(startRad);
    const y1 = 100 + 95 * Math.sin(startRad);
    const x2 = 100 + 95 * Math.cos(endRad);
    const y2 = 100 + 95 * Math.sin(endRad);

    // Position emoji in center of wedge
    const midAngle = startAngle + WEDGE_ANGLE / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;
    const emojiX = 100 + 60 * Math.cos(midRad);
    const emojiY = 100 + 60 * Math.sin(midRad);

    // Use theme color if available
    const wedgeColor = themeColors ? themeColors[i % themeColors.length] : wedge.color;

    return {
      path: `M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`,
      color: wedgeColor,
      emoji: wedge.emoji,
      emojiX,
      emojiY,
      key: wedge.type + i,
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.wheelContainer, animatedStyle]}>
          <Svg viewBox="0 0 200 200" style={styles.svg}>
            {/* Wedges */}
            {wedges.map((wedge) => (
              <G key={wedge.key}>
                <Path
                  d={wedge.path}
                  fill={wedge.color}
                  stroke="#333"
                  strokeWidth="1"
                />
                <SvgText
                  x={wedge.emojiX}
                  y={wedge.emojiY}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="18"
                >
                  {wedge.emoji}
                </SvgText>
              </G>
            ))}

            {/* Center circle */}
            <Circle cx="100" cy="100" r="25" fill="#FFD700" stroke="#B8860B" strokeWidth="3" />

            {/* Center button */}
            {!isAnimating && (
              <G>
                <Circle
                  cx="100"
                  cy="100"
                  r="22"
                  fill={canSpin ? '#FF6B6B' : '#888'}
                />
                <SvgText
                  x="100"
                  y="100"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
                >
                  SPIN!
                </SvgText>
              </G>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Tap area for center button */}
      {!isAnimating && (
        <Pressable
          style={styles.centerTap}
          onPress={handleSpin}
          disabled={!canSpin}
        />
      )}

      {/* Pointer */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheelContainer: {
    width: '100%',
    height: '100%',
    ...shadows.xl,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  centerTap: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  pointerContainer: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.red[600],
    ...shadows.lg,
  },
});
