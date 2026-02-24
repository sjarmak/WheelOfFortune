/**
 * Vanna Animation Logic
 *
 * Pure functions and constants for the 8-bit dancing Vanna sprite.
 * Extracted from the component for testability (no React Native dependencies).
 */

// Walk animation frame definition
export interface WalkFrame {
  readonly leftLegOffset: number;
  readonly rightLegOffset: number;
  readonly leftArmOffset: number;
  readonly rightArmOffset: number;
}

/**
 * 4-frame walk cycle matching web implementation:
 * Frame 0: Left leg forward (-2), right arm forward (+1)
 * Frame 1: Neutral (all offsets 0)
 * Frame 2: Right leg forward (-2), left arm forward (+1)
 * Frame 3: Neutral (all offsets 0)
 */
export const WALK_FRAMES: readonly WalkFrame[] = [
  { leftLegOffset: -2, rightLegOffset: 1, leftArmOffset: -2, rightArmOffset: 1 },
  { leftLegOffset: 0, rightLegOffset: 0, leftArmOffset: 0, rightArmOffset: 0 },
  { leftLegOffset: 1, rightLegOffset: -2, leftArmOffset: 1, rightArmOffset: -2 },
  { leftLegOffset: 0, rightLegOffset: 0, leftArmOffset: 0, rightArmOffset: 0 },
] as const;

// Character color constants
export const HAIR_COLOR = '#FACC15';
export const FACE_COLOR = '#FEF08A';
export const EYE_COLOR = '#2563EB';
export const DRESS_COLOR = '#DC2626';
export const DRESS_STRIPE_COLOR = 'rgba(255, 255, 255, 0.4)';
export const FLESH_COLOR = '#FEF08A';
export const SHOE_COLOR = '#1F2937';

// Celebration constants
export const CONFETTI_COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#D946EF', '#06B6D4'];
export const FIREWORK_COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#D946EF'];

export const CONFETTI_COUNT = 20;
export const FIREWORK_COUNT = 5;
export const FIREWORK_DURATION = 400; // ms

// Animation timing constants
export const DANCE_FRAME_TIME = 120; // ms per frame during dance
export const FRAME_COUNT = 4;

// Base pixel size for 8-bit scaling (increased from 3 to 4 for better visibility)
export const PIXEL = 4;

/**
 * Calculate dance bounce offset using sine wave.
 * Formula: sin(frame * PI/2) * 4
 * This produces a vertical bounce pattern tied to the walk frame.
 */
export function calculateDanceBounce(frameProgress: number): number {
  return Math.sin(frameProgress * Math.PI / 2) * 4;
}

/**
 * Get the current walk frame index from continuous progress value.
 * Progress animates linearly from 0 to FRAME_COUNT, then wraps.
 */
export function getFrameIndex(frameProgress: number): number {
  return Math.floor(frameProgress) % FRAME_COUNT;
}

/**
 * Get limb offset for a given frame, with optional dance multiplier.
 */
export function getLimbOffset(
  frameProgress: number,
  limb: 'leftLeg' | 'rightLeg' | 'leftArm' | 'rightArm',
  isDancing: boolean,
): number {
  const frame = getFrameIndex(frameProgress);
  const walkFrame = WALK_FRAMES[frame];

  const offsetKey = `${limb}Offset` as keyof WalkFrame;
  const baseOffset = walkFrame[offsetKey];

  // Dance mode multipliers match web: arms 2x, legs 1.5x
  if (!isDancing) return baseOffset;
  const isArm = limb === 'leftArm' || limb === 'rightArm';
  return baseOffset * (isArm ? 2 : 1.5);
}

/**
 * Get configuration for a confetti particle based on its index.
 * Returns deterministic pseudo-random values for visual variety.
 */
export function getConfettiConfig(index: number) {
  // Pseudo-random based on index
  const r1 = (index * 13 + 7) % 100 / 100;
  const r2 = (index * 29 + 3) % 100 / 100;
  const r3 = (index * 47 + 11) % 100 / 100;
  
  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    startX: (r1 * 60) - 30, // -30 to 30 spread
    startY: -30 - (r2 * 20), // -30 to -50
    endY: 20 + (r2 * 60), // 20 to 80
    drift: (r3 * 20) - 10, // -10 to +10
    rotation: r1 * 360,
    delay: r3 * 0.2 // 0 to 0.2s delay
  };
}

/**
 * Get configuration for a firework burst based on its index.
 */
export function getFireworkConfig(index: number) {
  // Pseudo-random based on index
  const r1 = (index * 17 + 5) % 100 / 100;
  const r2 = (index * 31 + 13) % 100 / 100;
  
  // Position around character (radius 20-35)
  const angle = (index / FIREWORK_COUNT) * Math.PI * 2 + (r1 * 1);
  const radius = 25 + (r2 * 10);
  
  return {
    color: FIREWORK_COLORS[index % FIREWORK_COLORS.length],
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    delay: index * 0.15, // Staggered
    scale: 0.5 + (r1 * 0.5)
  };
}
