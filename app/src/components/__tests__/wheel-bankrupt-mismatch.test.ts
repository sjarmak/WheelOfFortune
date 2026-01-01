import { describe, it, expect } from 'vitest';
import { WHEEL_CONFIG } from '../../engine/types';
import { SeededRNG } from '../../engine/rng';

describe('Bankrupt and $2500 wedges', () => {
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  it('should identify bankrupt and 2500 positions', () => {
    console.log('WHEEL_CONFIG:');
    WHEEL_CONFIG.forEach((w, i) => {
      const angle = -90 + i * wedgeAngle + wedgeAngle / 2;
      console.log(`  ${i}: ${w.label} (${w.type}) at angle ${angle}°`);
    });

    const bankruptIndices = WHEEL_CONFIG.map((w, i) => (w.type === 'BANKRUPT' ? i : -1)).filter((i) => i >= 0);
    const idx2500 = WHEEL_CONFIG.findIndex((w) => w.label === '$2500');

    console.log(`BANKRUPT indices: ${bankruptIndices}`);
    console.log(`$2500 index: ${idx2500}`);
  });

  it('should find which seed produces bankrupt landing', () => {
    // Try seeds 0-100 and find which ones land on bankrupt
    const bankruptIndices = WHEEL_CONFIG.map((w, i) => (w.type === 'BANKRUPT' ? i : -1)).filter((i) => i >= 0);

    console.log('\nSearching for seeds that land on BANKRUPT...');
    for (let seed = 0; seed < 200; seed++) {
      const rng = new SeededRNG(seed);
      const selectedIndex = rng.range(0, WHEEL_CONFIG.length);

      if (bankruptIndices.includes(selectedIndex)) {
        console.log(`Seed ${seed}: lands on BANKRUPT index ${selectedIndex}`);

        // Check if this could report $2500
        const idx2500 = WHEEL_CONFIG.findIndex((w) => w.label === '$2500');
        if (selectedIndex === idx2500) {
          console.log(`  -> But this is $2500!`);
        }
      }
    }
  });

  it('should trace the exact scenario', () => {
    // The user reported: visually BANKRUPT but reported $2500
    // Let's assume BANKRUPT is at some index and see what seed could cause this

    const idx2500 = WHEEL_CONFIG.findIndex((w) => w.label === '$2500');
    const bankruptIdx = WHEEL_CONFIG.findIndex((w) => w.type === 'BANKRUPT');

    console.log(`\nScenario: visual BANKRUPT (index ${bankruptIdx}, angle ${-90 + bankruptIdx * wedgeAngle + wedgeAngle / 2}°)`);
    console.log(`          reported $2500 (index ${idx2500}, angle ${-90 + idx2500 * wedgeAngle + wedgeAngle / 2}°)`);

    // For this to happen, the seed would need to pick index 3 (or 11),
    // but the angle calculation would land on index 0
    // This suggests the angle formula is off by one wedge

    // Find which seed picks index 3
    for (let seed = 0; seed < 500; seed++) {
      const rng = new SeededRNG(seed);
      const idx = rng.range(0, WHEEL_CONFIG.length);

      if (idx === bankruptIdx) {
        console.log(`Seed ${seed} picks BANKRUPT index ${bankruptIdx}`);

        // Now check if angle formula lands on $2500 instead
        const currentRotation = 0;
        const wedgeCenterAngle = -90 + bankruptIdx * wedgeAngle + wedgeAngle / 2;
        const spinAmount = 360 * 5 + wedgeCenterAngle - currentRotation;
        const finalRotation = spinAmount;

        // Find which wedge appears at pointer
        const tolerance = 11.25;
        let visualIdx = -1;
        for (let i = 0; i < WHEEL_CONFIG.length; i++) {
          const wc = -90 + i * wedgeAngle + wedgeAngle / 2;
          const svgAngle = (-finalRotation + wc) % 360;
          const normalized = (svgAngle + 360) % 360;
          if (normalized < tolerance || normalized > 360 - tolerance) {
            visualIdx = i;
            break;
          }
        }

        if (visualIdx === idx2500) {
          console.log(`  FOUND IT! This seed picks BANKRUPT but angle formula lands on $2500`);
          console.log(`    wedgeCenterAngle=${wedgeCenterAngle}°`);
          console.log(`    spinAmount=${spinAmount}°`);
          console.log(`    finalRotation=${finalRotation}°`);
        }
        if (seed === 9) {
          console.log(`Debug seed 9: selected=${bankruptIdx}, visual=${visualIdx} (${WHEEL_CONFIG[visualIdx]?.label})`);
        }
      }
    }
  });
});
