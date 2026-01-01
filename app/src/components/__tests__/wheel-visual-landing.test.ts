import { describe, it, expect } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';

describe('Wheel visual landing verification', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length; // 22.5°

  /**
   * Given a CSS rotation value, determine which wedge appears at the pointer (top, SVG 0°)
   * CSS rotate() rotates clockwise
   * SVG angles go counterclockwise
   * After CSS rotation by R, a wedge at SVG angle θ appears at SVG angle: -R + θ
   */
  const findWedgeAtPointer = (cssRotation: number): { index: number; label: string } => {
    const tolerance = 11.25; // Half a wedge angle

    for (let i = 0; i < WHEEL_CONFIG.length; i++) {
      const wedgeCenterAngle = -90 + i * wedgeAngle + wedgeAngle / 2;
      const svgAngle = (-cssRotation + wedgeCenterAngle) % 360;
      const normalized = (svgAngle + 360) % 360;

      if (normalized < tolerance || normalized > 360 - tolerance) {
        return { index: i, label: WHEEL_CONFIG[i].label };
      }
    }
    return { index: -1, label: 'UNKNOWN' };
  };

  it('should find BANKRUPT when it appears at the pointer', () => {
    // Find which indices have BANKRUPT
    const bankruptIndices = WHEEL_CONFIG.map((w, i) => w.type === 'BANKRUPT' ? i : -1).filter(i => i >= 0);
    expect(bankruptIndices.length).toBeGreaterThan(0);

    // For each BANKRUPT, calculate the CSS rotation needed to land on it
    bankruptIndices.forEach((bankruptIdx) => {
      const wedgeCenterAngle = -90 + bankruptIdx * wedgeAngle + wedgeAngle / 2;
      // We need: -cssRotation + wedgeCenterAngle = 0 (mod 360)
      // So: cssRotation = wedgeCenterAngle (mod 360)
      const cssRotation = ((wedgeCenterAngle % 360) + 360) % 360;

      const wedgeAtPointer = findWedgeAtPointer(cssRotation);
      console.log(`Bankrupt at index ${bankruptIdx}: cssRotation=${cssRotation}°, wedge at pointer=${wedgeAtPointer.label} (index ${wedgeAtPointer.index})`);

      expect(wedgeAtPointer.index).toBe(bankruptIdx, `CSS rotation ${cssRotation}° should have BANKRUPT at pointer`);
    });
  });

  it('should find $350 when it appears at the pointer', () => {
    const idx350 = WHEEL_CONFIG.findIndex(w => w.label === '$350');
    expect(idx350).toBeGreaterThanOrEqual(0);

    const wedgeCenterAngle = -90 + idx350 * wedgeAngle + wedgeAngle / 2;
    const cssRotation = ((wedgeCenterAngle % 360) + 360) % 360;

    const wedgeAtPointer = findWedgeAtPointer(cssRotation);
    console.log(`$350 at index ${idx350}: cssRotation=${cssRotation}°, wedge at pointer=${wedgeAtPointer.label} (index ${wedgeAtPointer.index})`);

    expect(wedgeAtPointer.index).toBe(idx350);
  });

  it('should verify the spin formula produces correct CSS rotation', () => {
    // When we spin and land on index i:
    // spinAmount = 360 * extraSpins + wedgeCenterAngle - currentRotation
    // newRotation = currentRotation + spinAmount
    // = currentRotation + 360 * extraSpins + wedgeCenterAngle - currentRotation
    // = 360 * extraSpins + wedgeCenterAngle

    const randomIndex = 3; // BANKRUPT
    const currentRotation = 0;
    const extraSpins = 5;

    const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
    const spinAmount = 360 * extraSpins + wedgeCenterAngle - currentRotation;
    const newRotation = currentRotation + spinAmount;

    const wedgeAtPointer = findWedgeAtPointer(newRotation);
    console.log(`After spin landing on index ${randomIndex}: newRotation=${newRotation}°, wedge at pointer=${wedgeAtPointer.label} (index ${wedgeAtPointer.index})`);

    expect(wedgeAtPointer.index).toBe(randomIndex);
  });
});
