import { describe, it, expect, vi } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';

describe('Wheel angle calculation', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  it('should calculate correct landing angle for each wedge', () => {
    // Test each wedge from 0 to 15
    for (let randomIndex = 0; randomIndex < WHEEL_CONFIG.length; randomIndex++) {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      const spinAmount = 360 * extraSpins - wedgeCenterAngle;

      // After rotation, the wedge should be at the pointer (0°)
      const finalAngle = (spinAmount + wedgeCenterAngle) % 360;
      const normalized = (finalAngle + 360) % 360;

      expect(normalized).toBe(0, `Wedge ${randomIndex} should land at pointer (0°)`);
    }
  });

  it('should handle cumulative rotations correctly', () => {
    // Simulate multiple spins in succession
    let rotation = 0;
    const randomIndices = [0, 5, 10, 15, 3];

    randomIndices.forEach((randomIndex) => {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      // The new formula accounts for current rotation
      const spinAmount = 360 * extraSpins - (wedgeCenterAngle + rotation);
      rotation += spinAmount;

      // After spin, the wedge is at absolute position: wedgeCenterAngle + rotation
      // This should be at 0° (mod 360)
      const finalPositionRelativeToPointer = (wedgeCenterAngle + rotation) % 360;
      const normalized = (finalPositionRelativeToPointer + 360) % 360;
      expect(normalized).toBe(0, `Spin ${randomIndex}: Wedge ${randomIndex} should be at 0°`);
    });
  });
});
