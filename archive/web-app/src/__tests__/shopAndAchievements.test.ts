/**
 * Tests for the shop and achievement system
 */

import { describe, it, expect } from 'vitest';
import {
  kidGameReducer,
  INITIAL_KID_GAME_STATE,
  getKidBankBalance,
  canAffordItem,
  checkForNewAchievements,
} from '../engine/kidGame';
import {
  INSTRUMENTS,
  WHEEL_THEMES,
  VANNA_DRESSES,
  VANNA_HAIR,
  ACHIEVEMENTS,
  getShopItem,
} from '../engine/shopTypes';
import { CASH_PER_STAR } from '../engine/kidTypes';

describe('Shop System', () => {
  describe('Shop Items', () => {
    it('should have valid instruments with prices and frequencies', () => {
      expect(INSTRUMENTS.length).toBeGreaterThan(0);

      for (const item of INSTRUMENTS) {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.price).toBeGreaterThan(0);
        expect(item.category).toBe('instrument');
        expect(item.frequencies).toBeDefined();
        expect(item.frequencies?.length).toBeGreaterThan(0);
      }
    });

    it('should have valid wheel themes with colors', () => {
      expect(WHEEL_THEMES.length).toBeGreaterThan(0);

      for (const theme of WHEEL_THEMES) {
        expect(theme.id).toBeDefined();
        expect(theme.price).toBeGreaterThan(0);
        expect(theme.category).toBe('wheel_theme');
        expect(theme.wheelColors).toBeDefined();
        expect(theme.wheelColors?.length).toBeGreaterThan(0);
      }
    });

    it('should have valid Vanna customizations with hex colors', () => {
      expect(VANNA_DRESSES.length).toBeGreaterThan(0);
      expect(VANNA_HAIR.length).toBeGreaterThan(0);

      for (const dress of VANNA_DRESSES) {
        expect(dress.category).toBe('vanna_dress');
        expect(dress.hexColor).toMatch(/^#[0-9A-F]{6}$/i);
      }

      for (const hair of VANNA_HAIR) {
        expect(hair.category).toBe('vanna_hair');
        expect(hair.hexColor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it('should retrieve shop items by ID', () => {
      const piano = getShopItem('piano');
      expect(piano).toBeDefined();
      expect(piano?.name).toBe('Piano');

      const rainbow = getShopItem('rainbow');
      expect(rainbow).toBeDefined();
      expect(rainbow?.category).toBe('wheel_theme');

      const nonExistent = getShopItem('nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Kid Bank Balance', () => {
    it('should calculate balance correctly with no purchases', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 10,
        },
      };

      const balance = getKidBankBalance(state);
      expect(balance).toBe(10 * CASH_PER_STAR);
    });

    it('should subtract spent money from balance', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 20,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            kidBankSpent: 500,
          },
        },
      };

      const balance = getKidBankBalance(state);
      expect(balance).toBe(20 * CASH_PER_STAR - 500);
    });

    it('should check affordability correctly', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 10, // $1000 balance
        },
      };

      expect(canAffordItem(state, 500)).toBe(true);
      expect(canAffordItem(state, 1000)).toBe(true);
      expect(canAffordItem(state, 1001)).toBe(false);
      expect(canAffordItem(state, 5000)).toBe(false);
    });
  });

  describe('Buying Items', () => {
    it('should add item to owned items when purchased', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 50, // $5000 balance
        },
      };

      const newState = kidGameReducer(state, { type: 'KID_BUY_ITEM', itemId: 'piano' });

      expect(newState.kidState.treasure.ownedItems).toContain('piano');
    });

    it('should deduct correct amount from kid bank spent', () => {
      const piano = getShopItem('piano')!;

      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 50,
        },
      };

      const newState = kidGameReducer(state, { type: 'KID_BUY_ITEM', itemId: 'piano' });

      expect(newState.kidState.treasure.kidBankSpent).toBe(piano.price);
    });

    it('should not buy item if already owned', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 50,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            ownedItems: ['piano'],
          },
        },
      };

      const newState = kidGameReducer(state, { type: 'KID_BUY_ITEM', itemId: 'piano' });

      // Should not have increased spending
      expect(newState.kidState.treasure.kidBankSpent).toBe(state.kidState.treasure.kidBankSpent);
    });

    it('should not buy item if cannot afford', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 1, // Only $100
        },
      };

      const newState = kidGameReducer(state, { type: 'KID_BUY_ITEM', itemId: 'piano' });

      expect(newState.kidState.treasure.ownedItems).not.toContain('piano');
      expect(newState.kidState.treasure.kidBankSpent).toBe(0);
    });
  });

  describe('Equipping Items', () => {
    it('should equip wheel theme', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            ownedItems: ['rainbow'],
          },
        },
      };

      const newState = kidGameReducer(state, {
        type: 'KID_EQUIP_ITEM',
        itemId: 'rainbow',
        category: 'wheel_theme',
      });

      expect(newState.kidState.treasure.equippedWheelTheme).toBe('rainbow');
    });

    it('should equip Vanna dress', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            ownedItems: ['dress_blue'],
          },
        },
      };

      const newState = kidGameReducer(state, {
        type: 'KID_EQUIP_ITEM',
        itemId: 'dress_blue',
        category: 'vanna_dress',
      });

      expect(newState.kidState.treasure.equippedDressColor).toBe('dress_blue');
    });

    it('should equip Vanna hair', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            ownedItems: ['hair_pink'],
          },
        },
      };

      const newState = kidGameReducer(state, {
        type: 'KID_EQUIP_ITEM',
        itemId: 'hair_pink',
        category: 'vanna_hair',
      });

      expect(newState.kidState.treasure.equippedHairColor).toBe('hair_pink');
    });

    it('should unequip items', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            equippedWheelTheme: 'rainbow',
            equippedDressColor: 'dress_blue',
            equippedHairColor: 'hair_pink',
          },
        },
      };

      let newState = kidGameReducer(state, { type: 'KID_UNEQUIP_ITEM', category: 'wheel_theme' });
      expect(newState.kidState.treasure.equippedWheelTheme).toBeNull();

      newState = kidGameReducer(state, { type: 'KID_UNEQUIP_ITEM', category: 'vanna_dress' });
      expect(newState.kidState.treasure.equippedDressColor).toBeNull();

      newState = kidGameReducer(state, { type: 'KID_UNEQUIP_ITEM', category: 'vanna_hair' });
      expect(newState.kidState.treasure.equippedHairColor).toBeNull();
    });
  });
});

describe('Achievement System', () => {
  describe('Achievement Definitions', () => {
    it('should have valid achievements with milestones', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);

      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeDefined();
        expect(achievement.title).toBeDefined();
        expect(achievement.starsRequired).toBeGreaterThan(0);
        expect(achievement.rewardItemIds.length).toBeGreaterThan(0);
      }
    });

    it('should have achievements in ascending order of stars required', () => {
      for (let i = 1; i < ACHIEVEMENTS.length; i++) {
        expect(ACHIEVEMENTS[i].starsRequired).toBeGreaterThan(ACHIEVEMENTS[i - 1].starsRequired);
      }
    });

    it('should have all reward items exist in shop', () => {
      for (const achievement of ACHIEVEMENTS) {
        for (const itemId of achievement.rewardItemIds) {
          const item = getShopItem(itemId);
          expect(item).toBeDefined();
        }
      }
    });
  });

  describe('Achievement Unlocking', () => {
    it('should detect new achievements when crossing milestone', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 10, // First milestone
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            unlockedAchievements: [],
          },
        },
      };

      const newAchievements = checkForNewAchievements(state);

      expect(newAchievements.length).toBeGreaterThan(0);
      expect(newAchievements[0].id).toBe('first_ten');
    });

    it('should not detect already unlocked achievements', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 10,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            unlockedAchievements: ['first_ten'],
          },
        },
      };

      const newAchievements = checkForNewAchievements(state);

      expect(newAchievements.find(a => a.id === 'first_ten')).toBeUndefined();
    });

    it('should detect multiple achievements at once', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 50, // Should unlock first_ten (10), star_collector (25), and super_star (50)
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            unlockedAchievements: [],
          },
        },
      };

      const newAchievements = checkForNewAchievements(state);

      expect(newAchievements.length).toBe(3);
    });
  });

  describe('Claiming Achievements', () => {
    it('should add achievement to unlocked list when claimed', () => {
      const state = INITIAL_KID_GAME_STATE;

      const newState = kidGameReducer(state, {
        type: 'KID_CLAIM_ACHIEVEMENT',
        achievementId: 'first_ten',
        rewardItemIds: ['piano'],
      });

      expect(newState.kidState.treasure.unlockedAchievements).toContain('first_ten');
    });

    it('should add reward items to owned items when achievement claimed', () => {
      const state = INITIAL_KID_GAME_STATE;

      const newState = kidGameReducer(state, {
        type: 'KID_CLAIM_ACHIEVEMENT',
        achievementId: 'first_ten',
        rewardItemIds: ['piano'],
      });

      expect(newState.kidState.treasure.ownedItems).toContain('piano');
    });

    it('should handle multiple reward items', () => {
      const state = INITIAL_KID_GAME_STATE;

      const newState = kidGameReducer(state, {
        type: 'KID_CLAIM_ACHIEVEMENT',
        achievementId: 'star_legend',
        rewardItemIds: ['dress_gold', 'galaxy'],
      });

      expect(newState.kidState.treasure.ownedItems).toContain('dress_gold');
      expect(newState.kidState.treasure.ownedItems).toContain('galaxy');
    });

    it('should not duplicate achievement if already claimed', () => {
      const state = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          treasure: {
            ...INITIAL_KID_GAME_STATE.kidState.treasure,
            unlockedAchievements: ['first_ten'],
          },
        },
      };

      const newState = kidGameReducer(state, {
        type: 'KID_CLAIM_ACHIEVEMENT',
        achievementId: 'first_ten',
        rewardItemIds: ['piano'],
      });

      // Should only have one instance
      const count = newState.kidState.treasure.unlockedAchievements.filter(
        id => id === 'first_ten'
      ).length;
      expect(count).toBe(1);
    });
  });
});
