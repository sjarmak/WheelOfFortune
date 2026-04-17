import { describe, it, expect } from 'vitest';
import { analyzePuzzlePack } from '../strategyAnalytics';
import { ALL_PACKS } from '../packs';

describe('strategyAnalytics performance', () => {
  it('should analyze large puzzle packs in under 500ms', () => {
    // Find the largest pack (Seasons 1-20 with ~18K puzzles)
    const largePack = ALL_PACKS.find(p => p.id === 'seasons-1-20-all');

    if (!largePack) {
      console.warn('Large pack not found, skipping performance test');
      return;
    }

    const startTime = performance.now();
    const analytics = analyzePuzzlePack(largePack.puzzles);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Analyzed ${largePack.puzzleCount} puzzles in ${duration.toFixed(2)}ms`);

    expect(analytics.totalPuzzles).toBe(largePack.puzzleCount);
    expect(duration).toBeLessThan(500); // Should complete in under 500ms
  });

  it('should analyze multiple packs efficiently', () => {
    const startTime = performance.now();

    // Analyze top 5 packs
    for (let i = 0; i < Math.min(5, ALL_PACKS.length); i++) {
      analyzePuzzlePack(ALL_PACKS[i].puzzles);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Analyzed 5 packs in ${duration.toFixed(2)}ms`);

    // Should be reasonably fast
    expect(duration).toBeLessThan(2000);
  });
});
