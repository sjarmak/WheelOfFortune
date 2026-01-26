/**
 * Theme and Design Tokens
 *
 * Centralized design system for the app.
 * Colors, typography, spacing, and common styles.
 */

import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Color palette - Modern dark theme with gold accents
export const colors = {
  // Background gradients - subtle dark navy
  gradient: {
    start: '#0a0e1a', // dark navy base
    middle: '#0f1525', // slightly lighter navy
    end: '#141b2e', // even lighter navy
  },

  // Primary accent - gold/amber (Wheel of Fortune theme)
  gold: {
    300: '#f4d03f',
    400: '#e8c547',
    500: '#d4a843', // primary gold accent
    600: '#c0983a',
    700: '#a8822f',
  },
  // Legacy amber/yellow for compatibility
  amber: {
    400: '#d4a843',
    500: '#c0983a',
  },
  yellow: {
    200: '#f4d03f',
    300: '#e8c547',
    400: '#d4a843',
    500: '#c0983a',
  },

  // Secondary accent - muted teal/blue
  blue: {
    400: '#3b82c4', // muted teal-blue
    500: '#2e6ba3',
    600: '#255a8a',
  },
  teal: {
    400: '#3b82c4',
    500: '#2e6ba3',
    600: '#255a8a',
  },

  // Status colors (kept for functionality)
  green: {
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    900: '#7f1d1d',
  },
  orange: {
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },

  // Legacy colors for compatibility (mapped to new palette)
  purple: {
    500: '#3b82c4', // map to teal-blue
    600: '#2e6ba3',
    700: '#255a8a',
    800: '#1e293b',
    900: '#0a0e1a',
  },
  pink: {
    300: '#d4a843', // map to gold
    400: '#c0983a',
    500: '#a8822f',
    600: '#8f6d26',
    800: '#0f1525',
  },

  // Neutrals - dark navy theme
  slate: {
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b', // dark surface
    900: '#0a0e1a', // darkest navy (base)
  },

  // Base
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.9)',
  },
} as const;

// Typography
export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
    '6xl': 48,
  },

  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// Spacing (based on 4px grid)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// Layout dimensions
export const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < 375,
  isMediumScreen: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 428,
  isLargeScreen: SCREEN_WIDTH >= 428,

  // Safe area defaults (will be overridden by SafeAreaProvider)
  safeAreaTop: Platform.OS === 'ios' ? 44 : 0,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 0,
} as const;

// Common styles
export const commonStyles = StyleSheet.create({
  // Flex utilities
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexCol: { flexDirection: 'column' },
  flexWrap: { flexWrap: 'wrap' },
  itemsCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },

  // Text
  textCenter: { textAlign: 'center' },
  textWhite: { color: colors.white },
  fontBold: { fontWeight: typography.weights.bold },

  // Spacing
  p1: { padding: spacing[1] },
  p2: { padding: spacing[2] },
  p3: { padding: spacing[3] },
  p4: { padding: spacing[4] },
  m1: { margin: spacing[1] },
  m2: { margin: spacing[2] },
  gap1: { gap: spacing[1] },
  gap2: { gap: spacing[2] },
  gap3: { gap: spacing[3] },

  // Border radius
  roundedLg: { borderRadius: borderRadius.lg },
  roundedXl: { borderRadius: borderRadius.xl },
  roundedFull: { borderRadius: borderRadius.full },

  // Full screen container
  screen: {
    flex: 1,
    backgroundColor: colors.slate[900], // dark navy base
  },

  // Centered container
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card base
  card: {
    backgroundColor: colors.overlay.medium,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },

  // Overlay backgrounds
  overlayLight: { backgroundColor: colors.overlay.light },
  overlayMedium: { backgroundColor: colors.overlay.medium },
  overlayDark: { backgroundColor: colors.overlay.dark },
});

// Animation durations
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
  wheel: 3000,
} as const;

// Easing curves
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;
