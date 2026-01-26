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
export const SPARKLE_COLOR = '#FFD700';

// Animation timing constants
export const DANCE_FRAME_TIME = 120; // ms per frame during dance
export const FRAME_COUNT = 4;
export const SPARKLE_COUNT = 6;
export const SPARKLE_DURATION = 600; // ms
export const SPARKLE_RADIUS = 20; // px from center

// Base pixel size for 8-bit scaling
export const PIXEL = 3;

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
 * Calculate sparkle position for a given index.
 * 6 sparkles evenly distributed in a circle.
 */
export function calculateSparkleAngle(index: number): number {
  return (index / SPARKLE_COUNT) * Math.PI * 2;
}

/**
 * Calculate sparkle x/y position from angle and progress.
 */
export function calculateSparklePosition(
  angle: number,
  progress: number,
  delay: number,
): { x: number; y: number; opacity: number; scale: number } {
  const adjustedProgress = Math.max(0, Math.min(1, progress - delay));
  const x = Math.cos(angle) * SPARKLE_RADIUS * adjustedProgress;
  const y = Math.sin(angle) * SPARKLE_RADIUS * adjustedProgress;

  // Opacity fades from 1 to 0 over the animation
  const opacity = adjustedProgress <= 0.5
    ? 1 - adjustedProgress * 0.4
    : 0.8 - (adjustedProgress - 0.5) * 1.6;

  // Scale pulses up then shrinks to 0
  let scale: number;
  if (adjustedProgress <= 0.3) {
    scale = 1 + adjustedProgress * (0.2 / 0.3);
  } else {
    scale = 1.2 * (1 - (adjustedProgress - 0.3) / 0.7);
  }

  return { x, y, opacity: Math.max(0, opacity), scale: Math.max(0, scale) };
}
