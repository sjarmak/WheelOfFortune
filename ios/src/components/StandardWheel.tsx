/**
 * Standard Mode Wheel Component
 *
 * Uses the full 24-wedge wheel with BANKRUPT/LOSE_TURN.
 */

import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, {
  G,
  Path,
  Circle,
  Defs,
  Text as SvgText,
  TextPath,
  TSpan,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { WHEEL_CONFIG, WheelWedge } from "../engine/types";
import { SeededRNG } from "../engine/rng";
import { calculateFinalRotation } from "../engine/wheelSpin";
import { colors, shadows } from "../styles/theme";

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

  const completeSpinCallback = useCallback(
    (wedgeIndex: number) => {
      setIsAnimating(false);
      const wedge = WHEEL_CONFIG[wedgeIndex];
      if (wedge.type === "BANKRUPT") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (wedge.type === "LOSE_TURN") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSpinComplete(wedge);
    },
    [onSpinComplete],
  );

  const clearTickInterval = useCallback(
    (id: ReturnType<typeof setInterval>) => {
      clearInterval(id);
    },
    [],
  );

  const handleSpin = useCallback(() => {
    if (!canSpin || isAnimating) return;

    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSpinStart();

    // Get deterministic outcome using seeded RNG
    const rng = new SeededRNG(seed);
    const winningIndex = rng.range(0, WEDGE_COUNT);

    // Calculate rotation to land on this wedge (matches web formula)
    const finalRotation = calculateFinalRotation(rotation.value, winningIndex);

    // Animate with tick sounds
    const tickInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 150);

    rotation.value = withTiming(
      finalRotation,
      {
        duration: SPIN_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(clearTickInterval)(tickInterval);
          runOnJS(completeSpinCallback)(winningIndex);
        }
      },
    );

    // Safety cleanup for tick sounds
    setTimeout(() => clearInterval(tickInterval), SPIN_DURATION + 500);
  }, [
    canSpin,
    isAnimating,
    onSpinStart,
    seed,
    rotation,
    completeSpinCallback,
    clearTickInterval,
  ]);

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

  // Generate wedge paths and text paths
  const wedges = WHEEL_CONFIG.map((wedge, i) => {
    const startAngle = i * WEDGE_ANGLE;
    const endAngle = startAngle + WEDGE_ANGLE;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 100 + 95 * Math.cos(startRad);
    const y1 = 100 + 95 * Math.sin(startRad);
    const x2 = 100 + 95 * Math.cos(endRad);
    const y2 = 100 + 95 * Math.sin(endRad);

    // Radial text path: from outer edge inward along the wedge midline
    const midRad = ((startAngle + WEDGE_ANGLE / 2 - 90 - 5) * Math.PI) / 180;
    const textOuterX = 100 + 91 * Math.cos(midRad);
    const textOuterY = 100 + 91 * Math.sin(midRad);
    const textInnerX = 100 + 23 * Math.cos(midRad);
    const textInnerY = 100 + 23 * Math.sin(midRad);

    // Text color based on wedge type
    const textColor = wedge.type === "BANKRUPT" ? "#fff" : "#000";
    const isSpecial =
      wedge.type === "BANKRUPT" ||
      wedge.type === "LOSE_TURN" ||
      wedge.type === "FREE_PLAY";

    // Position text: numbers shifted outward, long text more centered
    let textOffset = "35%";
    if (wedge.type === "LOSE_TURN" || wedge.type === "FREE_PLAY") {
      textOffset = "50%";
    } else if (wedge.type === "BANKRUPT") {
      textOffset = "42%";
    }

    return {
      wedgePath: `M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`,
      textPath: `M${textOuterX},${textOuterY} L${textInnerX},${textInnerY}`,
      color: wedge.color,
      label: wedge.label,
      textColor,
      isSpecial,
      textOffset,
      key: wedge.id,
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <AnimatedView style={[styles.wheelContainer, animatedStyle]}>
          <Svg viewBox="0 0 200 200" style={styles.svg}>
            {/* Define radial text paths */}
            <Defs>
              {wedges.map((wedge) => (
                <Path
                  key={`path-${wedge.key}`}
                  id={`textpath-${wedge.key}`}
                  d={wedge.textPath}
                  fill="none"
                />
              ))}
            </Defs>

            {/* Wedge fills */}
            {wedges.map((wedge) => (
              <Path
                key={wedge.key}
                d={wedge.wedgePath}
                fill={wedge.color}
                stroke="#222"
                strokeWidth="0.3"
              />
            ))}

            {/* Text labels along radial paths */}
            {wedges.map((wedge) => (
              <SvgText
                key={`label-${wedge.key}`}
                fontSize={wedge.isSpecial ? "8" : "14"}
                fontWeight="900"
                fill={wedge.textColor}
              >
                <TextPath
                  href={`#textpath-${wedge.key}`}
                  startOffset={wedge.textOffset}
                >
                  <TSpan textAnchor="middle">{wedge.label}</TSpan>
                </TextPath>
              </SvgText>
            ))}

            {/* Gold rim */}
            <Circle
              cx="100"
              cy="100"
              r="96"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="3"
            />

            {/* Center hub */}
            <Circle
              cx="100"
              cy="100"
              r="20"
              fill="#888"
              stroke="#555"
              strokeWidth="2"
            />

            {/* Center button */}
            {!isAnimating && (
              <G>
                <Circle
                  cx="100"
                  cy="100"
                  r="18"
                  fill={canSpin ? "#1a1a3e" : "#666"}
                />
                <Circle
                  cx="100"
                  cy="100"
                  r="12"
                  fill="none"
                  stroke="#aaa"
                  strokeWidth="1"
                />
                <SvgText
                  x="100"
                  y="101"
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
    width: "100%",
    maxWidth: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    alignSelf: "center",
  },
  wheelContainer: {
    width: "100%",
    height: "100%",
    ...shadows.xl,
  },
  svg: {
    width: "100%",
    height: "100%",
  },
  centerTap: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pointerContainer: {
    position: "absolute",
    top: -8,
    alignItems: "center",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
    ...shadows.lg,
  },
});
