/**
 * Button Component
 *
 * Themed button with variants matching the web app's styling.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

const gradients: Record<ButtonVariant, [string, string]> = {
  primary: [colors.blue[500], colors.purple[600]],
  secondary: [colors.slate[600], colors.slate[700]],
  success: [colors.green[500], colors.green[600]],
  danger: [colors.red[500], colors.red[600]],
  ghost: ['transparent', 'transparent'],
};

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: spacing[1.5], paddingHorizontal: spacing[3], fontSize: typography.sizes.sm },
  md: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], fontSize: typography.sizes.base },
  lg: { paddingVertical: spacing[3], paddingHorizontal: spacing[6], fontSize: typography.sizes.lg },
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps): React.JSX.Element {
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const sizeConfig = sizeStyles[size];
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          isGhost && styles.ghostGradient,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize: sizeConfig.fontSize },
              isGhost && styles.ghostText,
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  ghostGradient: {
    backgroundColor: colors.overlay.light,
  },
  text: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  ghostText: {
    color: colors.white,
  },
});
