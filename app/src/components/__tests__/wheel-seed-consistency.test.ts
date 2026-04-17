import { describe, it, expect } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';
import { SeededRNG } from '../../engine/rng';

describe('Wheel seeding consistency', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  /**
   * Simulate what happens when you spin:
   * 1. Wheel component receives seed prop
   * 2. Creates RNG and picks index
   * 3. Calculates spin animation to land on that index
   * 4. Reports the selected wedge
   */
  it('should pick index and land on that visual wedge consistently', () => {
    // Test multiple seeds
    const testSeeds = [100, 200, 300, 400, 500];

    testSeeds.forEach((baseSeed) => {
      // Simulate spinCount 0, 1, 2
      for (let spinCount = 0; spinCount < 3; spinCount++) {
        const seed = baseSeed + spinCount;
        const rng = new SeededRNG(seed);
        const selectedIndex = rng.range(0, WHEEL_CONFIG.length);

        // Simulate the spin animation
        // Starting from rotation = 0 (which it is on first spin of puzzle)
        const currentRotation = 0;
        const wedgeCenterAngle = -90 + selectedIndex * wedgeAngle + wedgeAngle / 2;
        const spinAmount = 360 * 5 + wedgeCenterAngle - currentRotation;
        const finalCssRotation = currentRotation + spinAmount;

        // Now verify which wedge appears at the pointer
        const tolerance = 11.25;
        let visualWedgeIndex = -1;
        for (let i = 0; i < WHEEL_CONFIG.length; i++) {
          const wedgeCenter = -90 + i * wedgeAngle + wedgeAngle / 2;
          const svgAngle = (-finalCssRotation + wedgeCenter) % 360;
          const normalized = (svgAngle + 360) % 360;

          if (normalized < tolerance || normalized > 360 - tolerance) {
            visualWedgeIndex = i;
            break;
          }
        }

        expect(visualWedgeIndex).toBe(
          selectedIndex,
          `Seed ${seed}: selected index ${selectedIndex} should land visually on index ${selectedIndex}, got ${visualWedgeIndex} (${WHEEL_CONFIG[visualWedgeIndex]?.label})`
        );
      }
    });
  });

  it('should handle cumulative rotations (multiple spins)', () => {
    const baseSeed = 42;
    let cssRotation = 0;

    // Simulate 3 spins in sequence
    for (let spinCount = 0; spinCount < 3; spinCount++) {
      const seed = baseSeed + spinCount;
      const rng = new SeededRNG(seed);
      const selectedIndex = rng.range(0, WHEEL_CONFIG.length);

      // Calculate spin with current rotation
      const wedgeCenterAngle = -90 + selectedIndex * wedgeAngle + wedgeAngle / 2;
      const spinAmount = 360 * 5 + wedgeCenterAngle - cssRotation;
      cssRotation += spinAmount;

      // Verify visual landing
      const tolerance = 11.25;
      let visualWedgeIndex = -1;
      for (let i = 0; i < WHEEL_CONFIG.length; i++) {
        const wedgeCenter = -90 + i * wedgeAngle + wedgeAngle / 2;
        const svgAngle = (-cssRotation + wedgeCenter) % 360;
        const normalized = (svgAngle + 360) % 360;

        if (normalized < tolerance || normalized > 360 - tolerance) {
          visualWedgeIndex = i;
          break;
        }
      }

      console.log(`Spin ${spinCount}: seed=${seed}, selected=${selectedIndex} (${WHEEL_CONFIG[selectedIndex].label}), visual=${visualWedgeIndex} (${WHEEL_CONFIG[visualWedgeIndex]?.label})`);

      expect(visualWedgeIndex).toBe(selectedIndex, `Spin ${spinCount}: mismatch`);
    }
  });
});
