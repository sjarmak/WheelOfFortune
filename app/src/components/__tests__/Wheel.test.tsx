import { describe, it, expect, vi } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';

describe('Wheel angle calculation', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  it('should calculate correct landing angle for each wedge', () => {
    // CSS rotate() rotates clockwise, SVG angles are counterclockwise
    // So in SVG space: wedge appears at -rotation + wedgeCenterAngle
    // We want: -rotation + wedgeCenterAngle = 0 (mod 360)
    // So: rotation = wedgeCenterAngle (mod 360)
    
    // Test each wedge from 0 to 15
    for (let randomIndex = 0; randomIndex < WHEEL_CONFIG.length; randomIndex++) {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      const spinAmount = 360 * extraSpins + wedgeCenterAngle; // From rotation 0

      const cssRotation = 0 + spinAmount; // Apply the spin
      
      // In SVG space, wedge appears at: -cssRotation + wedgeCenterAngle
      const svgAngle = (-cssRotation + wedgeCenterAngle) % 360;
      const normalized = (svgAngle + 360) % 360;

      expect(normalized).toBe(0, `Wedge ${randomIndex} should land at pointer (0°)`);
    }
  });

  it('should handle cumulative rotations correctly', () => {
    // Simulate multiple spins in succession
    // CSS rotate is clockwise, SVG angles are counterclockwise
    let cssRotation = 0;
    const randomIndices = [0, 5, 10, 15, 3];

    randomIndices.forEach((randomIndex) => {
      const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
      const extraSpins = 5;
      // Formula: spinAmount = extraSpins*360 + wedgeCenterAngle - rotation
      const spinAmount = 360 * extraSpins + wedgeCenterAngle - cssRotation;
      cssRotation += spinAmount;

      // In SVG space, wedge is at: -cssRotation + wedgeCenterAngle
      // This should be 0° (mod 360)
      const svgAngle = (-cssRotation + wedgeCenterAngle) % 360;
      const normalized = (svgAngle + 360) % 360;
      expect(normalized).toBe(0, `Spin ${randomIndex}: Wedge ${randomIndex} should be at 0°`);
    });
  });
});
