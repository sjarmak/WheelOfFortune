/**
 * Vanna Character Component
 *
 * 8-bit pixel art character for letter reveals.
 * Simplified for React Native using Views instead of CSS pixel art.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { getShopItem } from '../engine/shopTypes';
import { colors } from '../styles/theme';

interface VannaProps {
  isPuzzleSolved?: boolean;
  dressColorId?: string | null;
  hairColorId?: string | null;
}

// Default colors
const DEFAULT_HAIR_COLOR = '#FACC15'; // yellow-400
const DEFAULT_DRESS_COLOR = '#DC2626'; // red-600
const SKIN_COLOR = '#FEF08A'; // yellow-200

export function Vanna({
  isPuzzleSolved = false,
  dressColorId,
  hairColorId,
}: VannaProps): React.JSX.Element {
  // Get hex colors from equipped items
  const dressItem = dressColorId ? getShopItem(dressColorId) : null;
  const hairItem = hairColorId ? getShopItem(hairColorId) : null;
  const dressColor = dressItem?.hexColor || DEFAULT_DRESS_COLOR;
  const hairColor = hairItem?.hexColor || DEFAULT_HAIR_COLOR;

  // Animation values
  const bounce = useSharedValue(0);
  const armLeft = useSharedValue(0);
  const armRight = useSharedValue(0);
  const legLeft = useSharedValue(0);
  const legRight = useSharedValue(0);

  // Dance animation when puzzle is solved
  useEffect(() => {
    if (isPuzzleSolved) {
      // Bounce animation
      bounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        -1,
        false
      );

      // Arm wave animations
      armLeft.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 200 }),
          withTiming(2, { duration: 200 })
        ),
        -1,
        true
      );
      armRight.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 200 }),
          withTiming(-6, { duration: 200 })
        ),
        -1,
        true
      );

      // Leg animations
      legLeft.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 150 }),
          withTiming(2, { duration: 150 })
        ),
        -1,
        true
      );
      legRight.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 150 }),
          withTiming(-2, { duration: 150 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(bounce);
      cancelAnimation(armLeft);
      cancelAnimation(armRight);
      cancelAnimation(legLeft);
      cancelAnimation(legRight);
      bounce.value = withTiming(0);
      armLeft.value = withTiming(0);
      armRight.value = withTiming(0);
      legLeft.value = withTiming(0);
      legRight.value = withTiming(0);
    }
  }, [isPuzzleSolved]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const leftArmStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: armLeft.value }],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: armRight.value }],
  }));

  const leftLegStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: legLeft.value }],
  }));

  const rightLegStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: legRight.value }],
  }));

  return (
    <Animated.View style={[styles.container, bodyStyle]}>
      {/* Hair - wavy top */}
      <View style={styles.hairContainer}>
        <View style={[styles.hairStrand, { backgroundColor: hairColor }]} />
        <View style={[styles.hairStrand, { backgroundColor: hairColor }]} />
        <View style={[styles.hairStrand, { backgroundColor: hairColor }]} />
        <View style={[styles.hairStrand, { backgroundColor: hairColor }]} />
        <View style={[styles.hairStrand, { backgroundColor: hairColor }]} />
      </View>

      {/* Face */}
      <View style={styles.face}>
        {/* Eyes */}
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>

      {/* Body/Dress */}
      <View style={[styles.dress, { backgroundColor: dressColor }]}>
        {/* Dress pattern */}
        <View style={styles.dressStripe} />
        <View style={styles.dressStripe} />
        <View style={styles.dressStripe} />

        {/* Left Arm */}
        <Animated.View style={[styles.armLeft, leftArmStyle]} />

        {/* Right Arm */}
        <Animated.View style={[styles.armRight, rightArmStyle]} />
      </View>

      {/* Legs */}
      <View style={styles.legsContainer}>
        <Animated.View style={[styles.leg, leftLegStyle]} />
        <Animated.View style={[styles.leg, rightLegStyle]} />
      </View>

      {/* Shoes */}
      <View style={styles.shoesContainer}>
        <View style={styles.shoe} />
        <View style={styles.shoe} />
      </View>
    </Animated.View>
  );
}

const PIXEL = 3; // Base pixel size for 8-bit look

const styles = StyleSheet.create({
  container: {
    width: PIXEL * 14,
    height: PIXEL * 20,
    alignItems: 'center',
  },
  hairContainer: {
    flexDirection: 'row',
    gap: 1,
    height: PIXEL * 3,
  },
  hairStrand: {
    width: PIXEL,
    height: '100%',
  },
  face: {
    width: PIXEL * 12,
    height: PIXEL * 3,
    backgroundColor: SKIN_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PIXEL * 2,
    paddingHorizontal: PIXEL,
  },
  eye: {
    width: PIXEL,
    height: PIXEL,
    backgroundColor: colors.blue[600],
  },
  dress: {
    width: PIXEL * 14,
    height: PIXEL * 10,
    justifyContent: 'space-around',
    paddingVertical: PIXEL,
    position: 'relative',
  },
  dressStripe: {
    width: '100%',
    height: PIXEL,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  armLeft: {
    position: 'absolute',
    left: -PIXEL * 2,
    top: 0,
    width: PIXEL * 2,
    height: PIXEL * 4,
    backgroundColor: SKIN_COLOR,
  },
  armRight: {
    position: 'absolute',
    right: -PIXEL * 2,
    top: 0,
    width: PIXEL * 2,
    height: PIXEL * 4,
    backgroundColor: SKIN_COLOR,
  },
  legsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PIXEL * 8,
    paddingHorizontal: PIXEL,
  },
  leg: {
    width: PIXEL * 1.5,
    height: PIXEL * 3,
    backgroundColor: SKIN_COLOR,
  },
  shoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PIXEL * 10,
    paddingHorizontal: PIXEL,
  },
  shoe: {
    width: PIXEL * 2,
    height: PIXEL,
    backgroundColor: '#1f2937', // gray-800
  },
});
