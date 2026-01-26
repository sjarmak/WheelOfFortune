import { WHEEL_CONFIG } from './types';

const WEDGE_COUNT = WHEEL_CONFIG.length;
const WEDGE_ANGLE = 360 / WEDGE_COUNT;
const EXTRA_SPINS = 5;

/**
 * Calculate the final rotation angle to land on a specific wedge.
 * Matches the web formula: normalizes current rotation to account for
 * cumulative drift across consecutive spins.
 *
 * @param currentRotation - The wheel's current cumulative rotation in degrees
 * @param winningIndex - The index into WHEEL_CONFIG for the target wedge
 * @returns The new cumulative rotation that places the pointer at the wedge center
 */
export function calculateFinalRotation(
  currentRotation: number,
  winningIndex: number,
): number {
  const wedgeCenterOffset = winningIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2;
  const landingAngle = (360 - wedgeCenterOffset) % 360;
  const currentAngle = currentRotation % 360;

  let delta = landingAngle - currentAngle;
  if (delta < 0) delta += 360;

  const spinAmount = EXTRA_SPINS * 360 + delta;
  return currentRotation + spinAmount;
}
