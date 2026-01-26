/**
 * Standard Mode Wheel Component
 *
 * Uses the full 24-wedge wheel with BANKRUPT/LOSE_TURN.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText, Defs, TextPath } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';
import { SeededRNG } from '../engine/rng';
import { colors, shadows } from '../styles/theme';

interface StandardWheelProps {
  onSpinStart: () => void;
  onSpinComplete: (wedge: WheelWedge) => void;
  isSpinning: boolean;
  seed: number;
  canSpin: boolean;
}

const WEDGE_COUNT = WHEEL_CONFIG.length;
const WEDGE_ANGLE = 360 / WEDGE_COUNT;
const SPIN_DURATION = 4000;

const AnimatedView = Animated.View;

export function StandardWheel({
  onSpinStart,
  onSpinComplete,
  seed,
  canSpin,
}: StandardWheelProps): React.JSX.Element {
  const [isAnimating, setIsAnimating] = useState(false);
  const rotation = useSharedValue(0);
  const startY = useRef(0);

  const completeSpinCallback = useCallback((wedge: WheelWedge) => {
    setIsAnimating(false);
    if (wedge.type === 'BANKRUPT') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (wedge.type === 'LOSE_TURN') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSpinComplete(wedge);
  }, [onSpinComplete]);

  const handleSpin = useCallback(() => {
    if (!canSpin || isAnimating) return;

    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSpinStart();

    // Get deterministic outcome using seeded RNG
    const rng = new SeededRNG(seed);
    const winningIndex = rng.range(0, WEDGE_COUNT);
    const winningWedge = WHEEL_CONFIG[winningIndex];

    // Calculate rotation to land on this wedge
    const baseRotation = 360 * 5; // 5 full spins
    const wedgeRotation = winningIndex * WEDGE_ANGLE;
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
        runOnJS(completeSpinCallback)(winningWedge);
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
  const wedges = WHEEL_CONFIG.map((wedge, i) => {
    const startAngle = i * WEDGE_ANGLE;
    const endAngle = startAngle + WEDGE_ANGLE;
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = 100 + 95 * Math.cos(startRad);
    const y1 = 100 + 95 * Math.sin(startRad);
    const x2 = 100 + 95 * Math.cos(endRad);
    const y2 = 100 + 95 * Math.sin(endRad);

    // Text path for label - positioned radially outward from wedge center
    const midAngle = startAngle + WEDGE_ANGLE / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;
    // Extended radius for text - further out from center
    const textX1 = 100 + 80 * Math.cos(midRad);
    const textY1 = 100 + 80 * Math.sin(midRad);
    const textX2 = 100 + 55 * Math.cos(midRad);
    const textY2 = 100 + 55 * Math.sin(midRad);

    // Text color based on wedge type
    const textColor = wedge.type === 'BANKRUPT' ? '#fff' : 
                      wedge.type === 'LOSE_TURN' ? '#000' : '#000';

    // Use full labels - no shortening
    const displayLabel = wedge.label;

    return {
      path: `M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`,
      color: wedge.color,
      label: displayLabel,
      textPathId: `path-${wedge.id}`,
      textPathD: `M${textX1},${textY1} L${textX2},${textY2}`,
      textColor,
      key: wedge.id,
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <AnimatedView style={[styles.wheelContainer, animatedStyle]}>
          <Svg viewBox="0 0 200 200" style={styles.svg}>
            <Defs>
              {wedges.map((wedge) => (
                <Path
                  key={`${wedge.textPathId}-def`}
                  id={wedge.textPathId}
                  d={wedge.textPathD}
                  fill="none"
                />
              ))}
            </Defs>

            {/* Wedges */}
            {wedges.map((wedge) => (
              <G key={wedge.key}>
                <Path
                  d={wedge.path}
                  fill={wedge.color}
                  stroke="#333"
                  strokeWidth="0.5"
                />
              </G>
            ))}

            {/* Text labels along paths */}
            {wedges.map((wedge) => (
              <SvgText
                key={`label-${wedge.key}`}
                fontSize="5.5"
                fontWeight="bold"
                fill={wedge.textColor}
                textAnchor="middle"
                lengthAdjust="spacingAndGlyphs"
              >
                <TextPath href={`#${wedge.textPathId}`} startOffset="50%" lengthAdjust="spacingAndGlyphs">
                  {wedge.label}
                </TextPath>
              </SvgText>
            ))}

            {/* Center circle */}
            <Circle cx="100" cy="100" r="20" fill="#888" stroke="#555" strokeWidth="2" />

            {/* Center button */}
            {!isAnimating && (
              <G>
                <Circle
                  cx="100"
                  cy="100"
                  r="18"
                  fill={canSpin ? colors.green[500] : '#666'}
                />
                <SvgText
                  x="100"
                  y="100"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="7"
                  fontWeight="bold"
                  fill="white"
                >
                  SPIN
                </SvgText>
              </G>
            )}
          </Svg>
        </AnimatedView>
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pointerContainer: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.white,
    ...shadows.lg,
  },
});
