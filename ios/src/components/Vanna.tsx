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
  withDelay,
  cancelAnimation,
  Easing,
  interpolate,
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
  PIXEL,
  DANCE_FRAME_TIME,
  FRAME_COUNT,
  CONFETTI_COLORS,
  CONFETTI_COUNT,
  FIREWORK_COUNT,
  FIREWORK_DURATION,
  getConfettiConfig,
  getFireworkConfig,
} from '../engine/vannaAnimation';

interface VannaProps {
  readonly isDancing: boolean;
}

export function Vanna({ isDancing }: VannaProps): React.JSX.Element {
  // Shared value cycles 0→4 continuously; floor(value) % 4 gives frame index
  const frameProgress = useSharedValue(0);

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
    } else {
      cancelAnimation(frameProgress);
      frameProgress.value = 0;
    }
  }, [isDancing, frameProgress]);

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

      {/* Confetti and Fireworks Animations */}
      {isDancing && (
        <>
          {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
            <ConfettiView key={`confetti-${i}`} index={i} isDancing={isDancing} />
          ))}
          {Array.from({ length: FIREWORK_COUNT }, (_, i) => (
            <FireworkView key={`firework-${i}`} index={i} isDancing={isDancing} />
          ))}
        </>
      )}
    </View>
  );
}

interface CelebrationViewProps {
  readonly index: number;
  readonly isDancing: boolean;
}

function ConfettiView({ index, isDancing }: CelebrationViewProps): React.JSX.Element {
  const config = getConfettiConfig(index);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isDancing) {
      progress.value = 0;
      progress.value = withDelay(
        config.delay * 1000, // delay is in seconds in config, withDelay takes ms? Wait, reanimated withDelay usually takes ms.
        // Checking getConfettiConfig in web: delay: r3 * 0.2 // 0 to 0.2s delay.
        // Wait, 0.2s is 200ms.
        // Let's re-check getConfettiConfig in vannaAnimation.ts
        withTiming(1, { duration: 800, easing: Easing.linear })
      );
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }
  }, [isDancing, config.delay]);

  const style = useAnimatedStyle(() => {
    const val = progress.value;
    const x = interpolate(val, [0, 1], [config.startX, config.startX + config.drift]);
    const y = interpolate(val, [0, 1], [config.startY, config.endY]);
    const opacity = interpolate(val, [0, 0.8, 1], [1, 1, 0]);
    const rotate = interpolate(val, [0, 1], [0, config.rotation]);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotate}deg` }
      ],
      opacity,
      backgroundColor: config.color,
    };
  });

  // Note: config.delay is likely small (0-0.2), so treating it as seconds makes sense if passed to standard CSS animation,
  // but Reanimated withDelay takes milliseconds.
  // In getConfettiConfig: `delay: r3 * 0.2` (where r3 is 0-1). So max delay is 0.2.
  // If this is seconds, it is 200ms.
  // I will multiply by 1000 for withDelay.

  return <Animated.View style={[styles.confetti, style]} />;
}

function FireworkView({ index, isDancing }: CelebrationViewProps): React.JSX.Element {
  const config = getFireworkConfig(index);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isDancing) {
      progress.value = 0;
      progress.value = withDelay(
        config.delay * 1000, // delay is ~0.15 * index. Max index 4 -> 0.6s.
        withTiming(1, { duration: FIREWORK_DURATION, easing: Easing.out(Easing.quad) })
      );
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }
  }, [isDancing, config.delay]);

  const style = useAnimatedStyle(() => {
    const val = progress.value;
    const x = interpolate(val, [0, 1], [config.x * 0.2, config.x]);
    const y = interpolate(val, [0, 1], [config.y * 0.2, config.y]);
    const scale = interpolate(val, [0, 1], [0, config.scale]);
    const opacity = interpolate(val, [0, 0.5, 1], [1, 1, 0]);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale }
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.fireworkContainer, style]}>
       <View style={[styles.fireworkStar, { backgroundColor: config.color }]} />
    </Animated.View>
  );
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
  // Confetti: small colored rectangle
  confetti: {
    position: 'absolute',
    width: 4,
    height: 6,
    top: '50%',
    left: '50%',
    marginTop: -3,
    marginLeft: -2,
  },
  // Firework container: centers the star
  fireworkContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Firework star: rotated square
  fireworkStar: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
});