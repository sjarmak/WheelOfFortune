/**
 * Test Kid Mode state restoration
 * Ensures that saved state properly merges nested kidState.treasure
 */

import { describe, it, expect } from 'vitest';
import { INITIAL_KID_GAME_STATE } from '../engine/kidGame';
import { INITIAL_TREASURE_STATE } from '../engine/shopTypes';

describe('Kid Mode State Restoration', () => {
  it('should initialize with complete treasure state', () => {
    expect(INITIAL_KID_GAME_STATE.kidState.treasure).toEqual(INITIAL_TREASURE_STATE);
    expect(INITIAL_KID_GAME_STATE.kidState.treasure.kidBankSpent).toBe(0);
    expect(INITIAL_KID_GAME_STATE.kidState.treasure.ownedItems).toEqual([]);
  });

  it('should deep merge saved state with treasure structure preserved', () => {
    const initial = INITIAL_KID_GAME_STATE;
    
    // Simulate partially saved state (missing treasure)
    const saved = {
      kidState: {
        stars: 50,
        // Note: treasure is missing
      }
    };

    // Simulate the deep merge logic from KidModeApp
    const restored = {
      ...initial,
      ...saved,
      kidState: {
        ...initial.kidState,
        ...(saved.kidState || {}),
        treasure: {
          ...initial.kidState.treasure,
          ...(saved.kidState?.treasure || {})
        }
      }
    };

    // Verify treasure is fully present
    expect(restored.kidState.treasure).toBeDefined();
    expect(restored.kidState.treasure.kidBankSpent).toBe(0);
    expect(restored.kidState.treasure.ownedItems).toEqual([]);
    
    // Verify other properties merged correctly
    expect(restored.kidState.stars).toBe(50);
  });

  it('should handle fully saved state with treasure data', () => {
    const initial = INITIAL_KID_GAME_STATE;
    
    // Simulate fully saved state
    const saved = {
      kidState: {
        stars: 100,
        treasure: {
          ownedItems: ['piano', 'rainbow'],
          kidBankSpent: 1300,
          equippedWheelTheme: 'rainbow',
          equippedDressColor: null,
          equippedHairColor: null,
          unlockedAchievements: ['first_ten']
        }
      }
    };

    const restored = {
      ...initial,
      ...saved,
      kidState: {
        ...initial.kidState,
        ...(saved.kidState || {}),
        treasure: {
          ...initial.kidState.treasure,
          ...(saved.kidState?.treasure || {})
        }
      }
    };

    // Verify all treasure data is restored
    expect(restored.kidState.treasure.ownedItems).toEqual(['piano', 'rainbow']);
    expect(restored.kidState.treasure.kidBankSpent).toBe(1300);
    expect(restored.kidState.treasure.equippedWheelTheme).toBe('rainbow');
    expect(restored.kidState.stars).toBe(100);
  });

  it('should not crash when accessing kidBankSpent from restored state', () => {
    const initial = INITIAL_KID_GAME_STATE;
    
    // Simulate minimal saved state
    const saved = {
      roundCount: 5
    };

    const restored = {
      ...initial,
      ...saved,
      kidState: {
        ...initial.kidState,
        ...(saved.kidState || {}),
        treasure: {
          ...initial.kidState.treasure,
          ...(saved.kidState?.treasure || {})
        }
      }
    };

    // The critical test: accessing kidBankSpent should not crash
    expect(() => {
      const balance = restored.kidState.treasure.kidBankSpent;
      expect(balance).toBe(0);
    }).not.toThrow();
  });
});
