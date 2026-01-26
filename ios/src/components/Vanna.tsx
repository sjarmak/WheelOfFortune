/**
 * 8-bit Dancing Vanna Sprite Component
 *
 * Pixelated character built with React Native View components (colored rectangles).
 * Supports idle stance and dance animation mode with 4-frame walk cycle.
 * Uses react-native-reanimated for smooth animation.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import {
  WALK_FRAMES,
  HAIR_COLOR,
  FACE_COLOR,
  EYE_COLOR,
  DRESS_COLOR,
  DRESS_STRIPE_COLOR,
  FLESH_COLOR,
  SHOE_COLOR,
  SPARKLE_COLOR,
  PIXEL,
  DANCE_FRAME_TIME,
  FRAME_COUNT,
  SPARKLE_COUNT,
  SPARKLE_DURATION,
  SPARKLE_RADIUS,
} from '../engine/vannaAnimation';

interface VannaProps {
  readonly isDancing: boolean;
}

export function Vanna({ isDancing }: VannaProps): React.JSX.Element {
  // Shared value cycles 0→4 continuously; floor(value) % 4 gives frame index
  const frameProgress = useSharedValue(0);

  // Sparkle radiate-out animation progress (0→1, repeating)
  const sparkleProgress = useSharedValue(0);

  useEffect(() => {
    if (isDancing) {
      // Walk cycle: animate 0→4 over full cycle duration, repeat forever
      frameProgress.value = 0;
      frameProgress.value = withRepeat(
        withTiming(FRAME_COUNT, {
          duration: DANCE_FRAME_TIME * FRAME_COUNT,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      // Sparkle: pulse outward repeatedly
      sparkleProgress.value = 0;
      sparkleProgress.value = withRepeat(
        withTiming(1, { duration: SPARKLE_DURATION, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(frameProgress);
      cancelAnimation(sparkleProgress);
      frameProgress.value = 0;
      sparkleProgress.value = 0;
    }
  }, [isDancing, frameProgress, sparkleProgress]);

  // Dance bounce: vertical sine-wave translateY(sin(frame * PI/2) * 4)
  const bodyStyle = useAnimatedStyle(() => {
    if (!isDancing) {
      return { transform: [{ translateY: 0 }] };
    }
    const frame = frameProgress.value;
    const translateY = Math.sin(frame * Math.PI / 2) * 4;
    return { transform: [{ translateY }] };
  });

  // Left arm animated offset (doubled in dance mode per web)
  const leftArmStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameProgress.value) % FRAME_COUNT;
    const offset = WALK_FRAMES[frame].leftArmOffset * (isDancing ? 2 : 1);
    return { transform: [{ translateY: offset }] };
  });

  // Right arm animated offset
  const rightArmStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameProgress.value) % FRAME_COUNT;
    const offset = WALK_FRAMES[frame].rightArmOffset * (isDancing ? 2 : 1);
    return { transform: [{ translateY: offset }] };
  });

  // Left leg animated offset (1.5x in dance mode per web)
  const leftLegStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameProgress.value) % FRAME_COUNT;
    const offset = WALK_FRAMES[frame].leftLegOffset * (isDancing ? 1.5 : 1);
    return { transform: [{ translateY: offset }] };
  });

  // Right leg animated offset
  const rightLegStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameProgress.value) % FRAME_COUNT;
    const offset = WALK_FRAMES[frame].rightLegOffset * (isDancing ? 1.5 : 1);
    return { transform: [{ translateY: offset }] };
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, bodyStyle]}>
        {/* Hair - 5 yellow bars */}
        <View style={styles.hairContainer}>
          <View style={styles.hairStrand} />
          <View style={styles.hairStrand} />
          <View style={styles.hairStrand} />
          <View style={styles.hairStrand} />
          <View style={styles.hairStrand} />
        </View>

        {/* Face - yellow rectangle with 2 blue eyes */}
        <View style={styles.face}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>

        {/* Dress with arms */}
        <View style={styles.dress}>
          {/* White stripe pattern */}
          <View style={styles.dressStripe} />
          <View style={styles.dressStripe} />
          <View style={styles.dressStripe} />

          {/* Left arm - flesh-colored bar */}
          <Animated.View style={[styles.armLeft, leftArmStyle]} />

          {/* Right arm - flesh-colored bar */}
          <Animated.View style={[styles.armRight, rightArmStyle]} />
        </View>

        {/* Legs - flesh-colored bars */}
        <View style={styles.legsContainer}>
          <Animated.View style={[styles.leg, leftLegStyle]} />
          <Animated.View style={[styles.leg, rightLegStyle]} />
        </View>

        {/* Shoes - black rectangles */}
        <View style={styles.shoesContainer}>
          <View style={styles.shoe} />
          <View style={styles.shoe} />
        </View>
      </Animated.View>

      {/* 6 golden sparkles radiating outward during dance */}
      {isDancing &&
        Array.from({ length: SPARKLE_COUNT }, (_, i) => (
          <SparkleView
            key={`sparkle-${i}`}
            angle={(i / SPARKLE_COUNT) * Math.PI * 2}
            delay={i * 0.05}
            progress={sparkleProgress}
          />
        ))}
    </View>
  );
}

// Individual sparkle view that radiates outward with opacity fade
interface SparkleViewProps {
  readonly angle: number;
  readonly delay: number;
  readonly progress: SharedValue<number>;
}

function SparkleView({ angle, delay, progress }: SparkleViewProps): React.JSX.Element {
  const sparkleStyle = useAnimatedStyle(() => {
    const adjustedProgress = Math.max(0, Math.min(1, progress.value - delay));
    const x = Math.cos(angle) * SPARKLE_RADIUS * adjustedProgress;
    const y = Math.sin(angle) * SPARKLE_RADIUS * adjustedProgress;
    const opacity = interpolate(adjustedProgress, [0, 0.5, 1], [1, 0.8, 0]);
    const scale = interpolate(adjustedProgress, [0, 0.3, 1], [1, 1.2, 0]);
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.sparkle, sparkleStyle]} />;
}

const styles = StyleSheet.create({
  wrapper: {
    width: PIXEL * 18,
    height: PIXEL * 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
  },
  // Hair: 5 yellow bars across the top
  hairContainer: {
    flexDirection: 'row',
    gap: 1,
    height: PIXEL * 3,
  },
  hairStrand: {
    width: PIXEL,
    height: '100%',
    backgroundColor: HAIR_COLOR,
  },
  // Face: yellow rectangle with 2 blue eyes
  face: {
    width: PIXEL * 12,
    height: PIXEL * 3,
    backgroundColor: FACE_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PIXEL * 2,
    paddingHorizontal: PIXEL,
  },
  eye: {
    width: PIXEL,
    height: PIXEL,
    backgroundColor: EYE_COLOR,
  },
  // Dress: red rectangle with white stripes, arms on sides
  dress: {
    width: PIXEL * 14,
    height: PIXEL * 10,
    backgroundColor: DRESS_COLOR,
    justifyContent: 'space-around',
    paddingVertical: PIXEL,
    position: 'relative',
  },
  dressStripe: {
    width: '100%',
    height: PIXEL,
    backgroundColor: DRESS_STRIPE_COLOR,
  },
  armLeft: {
    position: 'absolute',
    left: -PIXEL * 2,
    top: 0,
    width: PIXEL * 2,
    height: PIXEL * 4,
    backgroundColor: FLESH_COLOR,
  },
  armRight: {
    position: 'absolute',
    right: -PIXEL * 2,
    top: 0,
    width: PIXEL * 2,
    height: PIXEL * 4,
    backgroundColor: FLESH_COLOR,
  },
  // Legs: flesh-colored bars
  legsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PIXEL * 8,
    paddingHorizontal: PIXEL,
  },
  leg: {
    width: PIXEL * 1.5,
    height: PIXEL * 3,
    backgroundColor: FLESH_COLOR,
  },
  // Shoes: black rectangles
  shoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PIXEL * 10,
    paddingHorizontal: PIXEL,
  },
  shoe: {
    width: PIXEL * 2,
    height: PIXEL,
    backgroundColor: SHOE_COLOR,
  },
  // Sparkle: golden circle
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SPARKLE_COLOR,
    top: '50%',
    left: '50%',
    marginTop: -3,
    marginLeft: -3,
  },
});
