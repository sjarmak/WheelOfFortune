import { describe, it, expect } from 'vitest';
import { ALL_PACKS } from '../engine/packs';

describe('Season Selection', () => {
  it('should have individual season packs for seasons 40-42', () => {
    for (const season of [40, 41, 42]) {
      const seasonPack = ALL_PACKS.find(p => p.id === `season-${season}`);
      expect(seasonPack).toBeDefined();
      expect(seasonPack?.name).toBe(`Season ${season}`);
      expect(seasonPack?.puzzleCount).toBeGreaterThan(0);
    }
  });

  it('should extract season numbers from puzzle data', () => {
    const season41Pack = ALL_PACKS.find(p => p.id === 'season-41');
    expect(season41Pack).toBeDefined();
    
    if (season41Pack) {
      const allHaveSeason = season41Pack.puzzles.every(p => p.season === 41);
      expect(allHaveSeason).toBe(true);
    }
  });

  it('should have correct puzzle counts for seasons 40-42', () => {
    // Each season pack should have at least one puzzle
    const allSeasonPacks = ALL_PACKS.filter(p => p.id.startsWith('season-'));
    allSeasonPacks.forEach(pack => {
      expect(pack.puzzleCount).toBeGreaterThan(0);
      expect(pack.puzzles.length).toBe(pack.puzzleCount);
    });
  });

  it('should have 3 individual season packs for seasons 40-42', () => {
    const allSeasonPacks = ALL_PACKS.filter(p => p.id.startsWith('season-'));
    
    // Should have 3 season packs (40, 41, 42)
    expect(allSeasonPacks.length).toBe(3);
    
    // Verify they are all properly formatted
    allSeasonPacks.forEach(pack => {
      expect(pack.id).toMatch(/^season-(40|41|42)$/);
      expect(pack.source).toMatch(/^season_(40|41|42)$/);
    });
  });

  it('should allow filtering packs by season via PackSelector', () => {
    // The PackSelector component filters packs with id.startsWith('season-')
    const seasonPacks = ALL_PACKS.filter(p => p.id.startsWith('season-'));
    
    // Verify we have season packs available
    expect(seasonPacks.length).toBeGreaterThan(0);
    
    // Each should be selectable
    seasonPacks.forEach(pack => {
      expect(pack.id).toMatch(/^season-\d+$/);
    });
  });

  it('should keep Seasons 1-20 as full collection pack', () => {
    const seasons1_20Pack = ALL_PACKS.find(p => p.id === 'seasons-1-20-all');
    expect(seasons1_20Pack).toBeDefined();
    expect(seasons1_20Pack?.name).toBe('Seasons 1-20 (Classic)');
    expect(seasons1_20Pack?.puzzleCount).toBe(12847);
  });
});
