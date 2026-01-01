import { describe, it, expect, vi } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';

describe('Wheel angle calculation', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  it('should calculate correct landing angle for each wedge', () => {
    // Test each wedge from 0 to 15
    // Formula: spinAmount = 360 * extraSpins - (wedgeCenterAngle + currentRotation)
    // This brings the wedge to the pointer (0° in SVG space after CSS rotation)
    for (let randomIndex = 0; randomIndex < WHEEL_CONFIG.length; randomIndex++) {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      const currentRotation = 0;
      const spinAmount = 360 * extraSpins - (wedgeCenterAngle + currentRotation);
      const cssRotation = currentRotation + spinAmount;
      
      // Verify which wedge appears at the pointer
      const tolerance = 11.25;
      let visualIdx = -1;
      for (let i = 0; i < WHEEL_CONFIG.length; i++) {
        const wc = -90 + i * wedgeAngle + wedgeAngle / 2;
        // Actual CSS matrix gives us: matrix shows rotation in degrees
        // A CSS rotation of cssRotation degrees puts wedge i at position: wc + cssRotation (in SVG space)
        const position = (wc + cssRotation) % 360;
        const normalized = (position + 360) % 360;
        if (normalized < tolerance || normalized > 360 - tolerance) {
          visualIdx = i;
          break;
        }
      }

      expect(visualIdx).toBe(randomIndex, `Wedge ${randomIndex} should land at pointer`);
    }
  });

  it('should handle cumulative rotations correctly', () => {
    // Simulate multiple spins in succession
    let cssRotation = 0;
    const randomIndices = [0, 5, 10, 15, 3];

    randomIndices.forEach((randomIndex) => {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      // Formula: spinAmount = 360 * extraSpins - (wedgeCenterAngle + currentRotation)
      const spinAmount = 360 * extraSpins - (wedgeCenterAngle + cssRotation);
      cssRotation += spinAmount;

      // Verify which wedge appears at the pointer
      const tolerance = 11.25;
      let visualIdx = -1;
      for (let i = 0; i < WHEEL_CONFIG.length; i++) {
        const wc = -90 + i * wedgeAngle + wedgeAngle / 2;
        const position = (wc + cssRotation) % 360;
        const normalized = (position + 360) % 360;
        if (normalized < tolerance || normalized > 360 - tolerance) {
          visualIdx = i;
          break;
        }
      }
      expect(visualIdx).toBe(randomIndex, `Spin ${randomIndex}: Wedge ${randomIndex} should be at pointer`);
    });
  });
});
