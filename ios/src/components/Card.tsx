/**
 * Card Component
 *
 * Reusable card with various styles.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'transparent';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  padding = 3,
}: CardProps): React.JSX.Element {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
  },
  default: {
    backgroundColor: colors.overlay.medium,
  },
  elevated: {
    backgroundColor: colors.slate[800],
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.slate[600],
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});
