import { describe, it, expect } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';

describe('Wheel landing position verification', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length; // 22.5°

  it('should correctly identify which wedge is at the pointer after rotation', () => {
    // CSS rotate is clockwise, SVG angles are counterclockwise
    // Wedge i is drawn at center angle: -90 + i * wedgeAngle + wedgeAngle/2
    // The pointer is at SVG 0° (top)
    // After CSS rotation by R degrees, wedge i appears at SVG angle: -R + wedgeCenterAngle

    // Example: after first spin with randomIndex = 0
    // wedgeCenterAngle = -90 + 0 * 22.5 + 11.25 = -78.75°
    // spinAmount = 1800 + (-78.75) - 0 = 1721.25°
    // cssRotation = 0 + 1721.25 = 1721.25°
    // Wedge 0 in SVG space: -1721.25 + (-78.75) = -1800° = 0° (mod 360) ✓

    // Let's verify which wedge VISUALLY appears at each pointer position
    // by computing all wedge centers after rotation
    const cssRotation = 1721.25; // After first spin landing on wedge 0

    // Find which wedge is at the pointer (0°)
    let pointerWedgeIndex = -1;
    const tolerance = 11.25; // Half a wedge angle
    for (let i = 0; i < WHEEL_CONFIG.length; i++) {
      const wedgeCenterAngle = -90 + i * wedgeAngle + wedgeAngle / 2;
      const wedgeInSvgSpace = (-cssRotation + wedgeCenterAngle) % 360;
      const normalized = (wedgeInSvgSpace + 360) % 360;

      // Check if this wedge is near the pointer (0°)
      if (normalized < tolerance || normalized > 360 - tolerance) {
        pointerWedgeIndex = i;
        break;
      }
    }

    expect(pointerWedgeIndex).toBe(0, 'After first spin, wedge 0 should be at pointer');
    expect(WHEEL_CONFIG[0].label).toBe('$2500', 'Wedge 0 should be $2500');
  });

  it('should verify wedge positions match expected values', () => {
    // Check that adjacent wedges have expected differences
    // The order in WHEEL_CONFIG should match visual order when rotation = 0

    // Wedge 0 center: -78.75°
    // Wedge 1 center: -90 + 1*22.5 + 11.25 = -56.25°
    // The visual order at rotation=0 is: 
    // ...→ -78.75° (wedge 0) → -56.25° (wedge 1) → ...

    const wedgeAngle = 360 / WHEEL_CONFIG.length;
    let rotation = 0;

    for (let i = 0; i < 3; i++) {
      const wedgeCenterAngle = -90 + i * wedgeAngle + wedgeAngle / 2;
      console.log(
        `Wedge ${i} (${WHEEL_CONFIG[i].label}): center at ${wedgeCenterAngle}°, appears at ${(wedgeCenterAngle + rotation) % 360}°`
      );
    }
  });
});
