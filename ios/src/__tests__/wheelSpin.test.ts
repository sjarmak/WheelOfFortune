import { describe, it, expect } from 'vitest';
import { calculateFinalRotation } from '../engine/wheelSpin';
import { WHEEL_CONFIG } from '../engine/types';
import { SeededRNG } from '../engine/rng';

const WEDGE_COUNT = WHEEL_CONFIG.length; // 24
const WEDGE_ANGLE = 360 / WEDGE_COUNT;   // 15 degrees

/**
 * Given a final rotation angle, determine which wedge the pointer lands on.
 * The pointer is at the top (0 degrees). The wheel rotates clockwise.
 * Wedge 0 starts at 0 degrees (top) and spans WEDGE_ANGLE degrees clockwise.
 *
 * The pointer-relative angle is (360 - (rotation % 360)) % 360, which gives
 * the "unrotated" angle the pointer points to on the static wheel.
 */
function getWedgeIndexFromRotation(rotation: number): number {
  const normalizedAngle = ((rotation % 360) + 360) % 360;
  // The pointer is at top. When wheel rotates by `rotation` degrees clockwise,
  // the pointer effectively points at angle (360 - normalizedAngle) % 360 on the wheel.
  const pointerAngle = (360 - normalizedAngle) % 360;
  return Math.floor(pointerAngle / WEDGE_ANGLE);
}

/**
 * Check if a rotation places the pointer within the wedge at winningIndex,
 * specifically near the center of that wedge.
 */
function isPointerInWedge(rotation: number, wedgeIndex: number): boolean {
  const normalizedAngle = ((rotation % 360) + 360) % 360;
  const pointerAngle = (360 - normalizedAngle) % 360;

  const wedgeStart = wedgeIndex * WEDGE_ANGLE;
  const wedgeEnd = wedgeStart + WEDGE_ANGLE;

  // Allow small floating-point tolerance at boundaries
  const epsilon = 0.001;
  return pointerAngle >= wedgeStart - epsilon && pointerAngle < wedgeEnd + epsilon;
}

describe('calculateFinalRotation', () => {
  it('returns a value greater than current rotation (always spins forward)', () => {
    for (let i = 0; i < WEDGE_COUNT; i++) {
      const result = calculateFinalRotation(0, i);
      expect(result).toBeGreaterThan(0);
    }
  });

  it('includes at least 5 full extra spins', () => {
    const result = calculateFinalRotation(0, 0);
    expect(result).toBeGreaterThanOrEqual(5 * 360);
  });

  describe('for seeds 1-50, pointer lands within the correct wedge', () => {
    for (let seed = 1; seed <= 50; seed++) {
      it(`seed ${seed}: rotation lands on the correct wedge`, () => {
        const rng = new SeededRNG(seed);
        const winningIndex = rng.range(0, WEDGE_COUNT);
        const finalRotation = calculateFinalRotation(0, winningIndex);

        expect(isPointerInWedge(finalRotation, winningIndex)).toBe(true);
      });
    }
  });

  describe('for seeds 1-50, pointer lands near the center of the wedge', () => {
    for (let seed = 1; seed <= 50; seed++) {
      it(`seed ${seed}: rotation lands at wedge center`, () => {
        const rng = new SeededRNG(seed);
        const winningIndex = rng.range(0, WEDGE_COUNT);
        const finalRotation = calculateFinalRotation(0, winningIndex);

        const normalizedAngle = ((finalRotation % 360) + 360) % 360;
        const pointerAngle = (360 - normalizedAngle) % 360;
        const wedgeCenter = winningIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2;

        // Pointer should be at the exact center of the wedge
        expect(pointerAngle).toBeCloseTo(wedgeCenter, 5);
      });
    }
  });

  describe('consecutive spins maintain correct mapping', () => {
    it('3 consecutive spins all land on correct wedges', () => {
      let currentRotation = 0;
      const seeds = [7, 42, 99];

      for (const seed of seeds) {
        const rng = new SeededRNG(seed);
        const winningIndex = rng.range(0, WEDGE_COUNT);
        const finalRotation = calculateFinalRotation(currentRotation, winningIndex);

        expect(finalRotation).toBeGreaterThan(currentRotation);
        expect(isPointerInWedge(finalRotation, winningIndex)).toBe(true);

        // Verify it lands at the center
        const normalizedAngle = ((finalRotation % 360) + 360) % 360;
        const pointerAngle = (360 - normalizedAngle) % 360;
        const wedgeCenter = winningIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2;
        expect(pointerAngle).toBeCloseTo(wedgeCenter, 5);

        // Update for next spin
        currentRotation = finalRotation;
      }
    });

    it('5 consecutive spins with various starting rotations', () => {
      let currentRotation = 1234.567; // Start from an arbitrary rotation
      const seeds = [1, 13, 27, 38, 50];

      for (const seed of seeds) {
        const rng = new SeededRNG(seed);
        const winningIndex = rng.range(0, WEDGE_COUNT);
        const finalRotation = calculateFinalRotation(currentRotation, winningIndex);

        expect(finalRotation).toBeGreaterThan(currentRotation);
        expect(isPointerInWedge(finalRotation, winningIndex)).toBe(true);

        currentRotation = finalRotation;
      }
    });

    it('10 consecutive spins never drift from correct wedge', () => {
      let currentRotation = 0;

      for (let seed = 1; seed <= 10; seed++) {
        const rng = new SeededRNG(seed);
        const winningIndex = rng.range(0, WEDGE_COUNT);
        const finalRotation = calculateFinalRotation(currentRotation, winningIndex);

        const detectedIndex = getWedgeIndexFromRotation(finalRotation);
        expect(detectedIndex).toBe(winningIndex);

        currentRotation = finalRotation;
      }
    });
  });

  describe('edge cases', () => {
    it('winningIndex 0 (first wedge) lands correctly', () => {
      const finalRotation = calculateFinalRotation(0, 0);
      expect(isPointerInWedge(finalRotation, 0)).toBe(true);
    });

    it('winningIndex 23 (last wedge) lands correctly', () => {
      const finalRotation = calculateFinalRotation(0, 23);
      expect(isPointerInWedge(finalRotation, 23)).toBe(true);
    });

    it('large starting rotation still works correctly', () => {
      const largeRotation = 360 * 100 + 137;
      for (let i = 0; i < WEDGE_COUNT; i++) {
        const finalRotation = calculateFinalRotation(largeRotation, i);
        expect(isPointerInWedge(finalRotation, i)).toBe(true);
      }
    });
  });
});
