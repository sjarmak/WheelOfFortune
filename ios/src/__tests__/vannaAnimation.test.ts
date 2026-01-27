import { describe, it, expect } from 'vitest';
import {
  WALK_FRAMES,
  HAIR_COLOR,
  FACE_COLOR,
  EYE_COLOR,
  DRESS_COLOR,
  FLESH_COLOR,
  SHOE_COLOR,
  PIXEL,
  DANCE_FRAME_TIME,
  FRAME_COUNT,
  CONFETTI_COUNT,
  FIREWORK_COUNT,
  FIREWORK_DURATION,
  CONFETTI_COLORS,
  FIREWORK_COLORS,
  calculateDanceBounce,
  getFrameIndex,
  getLimbOffset,
  getConfettiConfig,
  getFireworkConfig,
} from '../engine/vannaAnimation';

describe('vannaAnimation', () => {
  describe('WALK_FRAMES', () => {
    it('has exactly 4 frames', () => {
      expect(WALK_FRAMES).toHaveLength(4);
    });

    it('frame 0: left leg forward (-2), right arm forward (+1)', () => {
      const frame = WALK_FRAMES[0];
      expect(frame.leftLegOffset).toBe(-2);
      expect(frame.rightLegOffset).toBe(1);
      expect(frame.leftArmOffset).toBe(-2);
      expect(frame.rightArmOffset).toBe(1);
    });

    it('frame 1: neutral (all zeroes)', () => {
      const frame = WALK_FRAMES[1];
      expect(frame.leftLegOffset).toBe(0);
      expect(frame.rightLegOffset).toBe(0);
      expect(frame.leftArmOffset).toBe(0);
      expect(frame.rightArmOffset).toBe(0);
    });

    it('frame 2: right leg forward (-2), left arm forward (+1)', () => {
      const frame = WALK_FRAMES[2];
      expect(frame.leftLegOffset).toBe(1);
      expect(frame.rightLegOffset).toBe(-2);
      expect(frame.leftArmOffset).toBe(1);
      expect(frame.rightArmOffset).toBe(-2);
    });

    it('frame 3: neutral (all zeroes)', () => {
      const frame = WALK_FRAMES[3];
      expect(frame.leftLegOffset).toBe(0);
      expect(frame.rightLegOffset).toBe(0);
      expect(frame.leftArmOffset).toBe(0);
      expect(frame.rightArmOffset).toBe(0);
    });

    it('frames 1 and 3 are identical neutral frames', () => {
      expect(WALK_FRAMES[1]).toEqual(WALK_FRAMES[3]);
    });

    it('frames 0 and 2 are opposite walking positions', () => {
      expect(WALK_FRAMES[0].leftLegOffset).toBe(WALK_FRAMES[2].rightLegOffset);
      expect(WALK_FRAMES[0].rightLegOffset).toBe(WALK_FRAMES[2].leftLegOffset);
      expect(WALK_FRAMES[0].leftArmOffset).toBe(WALK_FRAMES[2].rightArmOffset);
      expect(WALK_FRAMES[0].rightArmOffset).toBe(WALK_FRAMES[2].leftArmOffset);
    });
  });

  describe('character colors', () => {
    it('hair is yellow (#FACC15)', () => {
      expect(HAIR_COLOR).toBe('#FACC15');
    });

    it('face is light yellow (#FEF08A)', () => {
      expect(FACE_COLOR).toBe('#FEF08A');
    });

    it('eyes are blue (#2563EB)', () => {
      expect(EYE_COLOR).toBe('#2563EB');
    });

    it('dress is red (#DC2626)', () => {
      expect(DRESS_COLOR).toBe('#DC2626');
    });

    it('flesh matches face color', () => {
      expect(FLESH_COLOR).toBe(FACE_COLOR);
    });

    it('shoes are dark (#1F2937)', () => {
      expect(SHOE_COLOR).toBe('#1F2937');
    });
  });

  describe('animation constants', () => {
    it('PIXEL base size is 3', () => {
      expect(PIXEL).toBe(3);
    });

    it('FRAME_COUNT is 4 (matching WALK_FRAMES length)', () => {
      expect(FRAME_COUNT).toBe(4);
      expect(FRAME_COUNT).toBe(WALK_FRAMES.length);
    });

    it('DANCE_FRAME_TIME is 120ms (faster than web walk at 200ms)', () => {
      expect(DANCE_FRAME_TIME).toBe(120);
    });

    it('CONFETTI_COUNT is 20', () => {
      expect(CONFETTI_COUNT).toBe(20);
    });

    it('FIREWORK_COUNT is 5', () => {
      expect(FIREWORK_COUNT).toBe(5);
    });

    it('FIREWORK_DURATION is 400ms', () => {
      expect(FIREWORK_DURATION).toBe(400);
    });

    it('CONFETTI_COLORS has 6 colors', () => {
      expect(CONFETTI_COLORS).toHaveLength(6);
    });

    it('FIREWORK_COLORS has 5 colors', () => {
      expect(FIREWORK_COLORS).toHaveLength(5);
    });
  });

  describe('calculateDanceBounce', () => {
    it('returns 0 at frame 0 (sin(0) = 0)', () => {
      expect(calculateDanceBounce(0)).toBeCloseTo(0, 10);
    });

    it('returns 4 at frame 1 (sin(PI/2) = 1, * 4 = 4)', () => {
      expect(calculateDanceBounce(1)).toBeCloseTo(4, 10);
    });

    it('returns ~0 at frame 2 (sin(PI) ≈ 0)', () => {
      expect(calculateDanceBounce(2)).toBeCloseTo(0, 5);
    });

    it('returns -4 at frame 3 (sin(3*PI/2) = -1, * 4 = -4)', () => {
      expect(calculateDanceBounce(3)).toBeCloseTo(-4, 10);
    });

    it('produces sinusoidal pattern over full cycle (0→4→0→-4→0)', () => {
      const values = [0, 1, 2, 3, 4].map(calculateDanceBounce);
      expect(values[0]).toBeCloseTo(0, 5);
      expect(values[1]).toBeCloseTo(4, 5);
      expect(values[2]).toBeCloseTo(0, 5);
      expect(values[3]).toBeCloseTo(-4, 5);
      expect(values[4]).toBeCloseTo(0, 5);
    });

    it('handles fractional frame progress smoothly', () => {
      const mid = calculateDanceBounce(0.5);
      expect(mid).toBeCloseTo(Math.sin(0.5 * Math.PI / 2) * 4, 10);
    });
  });

  describe('getFrameIndex', () => {
    it('returns 0 for progress 0', () => {
      expect(getFrameIndex(0)).toBe(0);
    });

    it('returns 1 for progress 1', () => {
      expect(getFrameIndex(1)).toBe(1);
    });

    it('returns 2 for progress 2', () => {
      expect(getFrameIndex(2)).toBe(2);
    });

    it('returns 3 for progress 3', () => {
      expect(getFrameIndex(3)).toBe(3);
    });

    it('wraps at 4 back to 0', () => {
      expect(getFrameIndex(4)).toBe(0);
    });

    it('wraps correctly for larger values', () => {
      expect(getFrameIndex(5)).toBe(1);
      expect(getFrameIndex(7)).toBe(3);
      expect(getFrameIndex(8)).toBe(0);
    });

    it('floors fractional values', () => {
      expect(getFrameIndex(0.5)).toBe(0);
      expect(getFrameIndex(1.9)).toBe(1);
      expect(getFrameIndex(3.99)).toBe(3);
    });
  });

  describe('getLimbOffset', () => {
    it('returns correct left leg offset at frame 0', () => {
      expect(getLimbOffset(0, 'leftLeg', false)).toBe(-2);
    });

    it('returns correct right arm offset at frame 0', () => {
      expect(getLimbOffset(0, 'rightArm', false)).toBe(1);
    });

    it('returns 0 for all limbs at neutral frame 1', () => {
      expect(getLimbOffset(1, 'leftLeg', false)).toBe(0);
      expect(getLimbOffset(1, 'rightLeg', false)).toBe(0);
      expect(getLimbOffset(1, 'leftArm', false)).toBe(0);
      expect(getLimbOffset(1, 'rightArm', false)).toBe(0);
    });

    it('doubles arm offsets in dance mode', () => {
      expect(getLimbOffset(0, 'leftArm', true)).toBe(-4);
      expect(getLimbOffset(0, 'rightArm', true)).toBe(2);
    });

    it('multiplies leg offsets by 1.5 in dance mode', () => {
      expect(getLimbOffset(0, 'leftLeg', true)).toBe(-3);
      expect(getLimbOffset(0, 'rightLeg', true)).toBe(1.5);
    });

    it('returns 0 for neutral frames in dance mode too', () => {
      expect(getLimbOffset(1, 'leftArm', true)).toBe(0);
      expect(getLimbOffset(1, 'leftLeg', true)).toBe(0);
    });

    it('handles frame wrapping via getFrameIndex', () => {
      expect(getLimbOffset(4, 'leftLeg', false)).toBe(getLimbOffset(0, 'leftLeg', false));
    });
  });

  describe('getConfettiConfig', () => {
    it('returns deterministic config for same index', () => {
      const config1 = getConfettiConfig(5);
      const config2 = getConfettiConfig(5);
      expect(config1).toEqual(config2);
    });

    it('returns different configs for different indices', () => {
      const config1 = getConfettiConfig(1);
      const config2 = getConfettiConfig(2);
      expect(config1).not.toEqual(config2);
    });

    it('config has all required fields', () => {
      const config = getConfettiConfig(0);
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('startX');
      expect(config).toHaveProperty('startY');
      expect(config).toHaveProperty('endY');
      expect(config).toHaveProperty('drift');
      expect(config).toHaveProperty('rotation');
      expect(config).toHaveProperty('delay');
    });

    it('values are within expected ranges', () => {
      const config = getConfettiConfig(0);
      
      expect(config.startX).toBeGreaterThanOrEqual(-30);
      expect(config.startX).toBeLessThanOrEqual(30);

      expect(config.startY).toBeGreaterThanOrEqual(-50);
      expect(config.startY).toBeLessThanOrEqual(-30);

      expect(config.endY).toBeGreaterThanOrEqual(20);
      expect(config.endY).toBeLessThanOrEqual(80);

      expect(config.drift).toBeGreaterThanOrEqual(-10);
      expect(config.drift).toBeLessThanOrEqual(10);

      expect(config.delay).toBeGreaterThanOrEqual(0);
      expect(config.delay).toBeLessThanOrEqual(0.2);
    });
  });

  describe('getFireworkConfig', () => {
    it('returns deterministic config for same index', () => {
      const config1 = getFireworkConfig(3);
      const config2 = getFireworkConfig(3);
      expect(config1).toEqual(config2);
    });

    it('returns different configs for different indices', () => {
      const config1 = getFireworkConfig(1);
      const config2 = getFireworkConfig(2);
      expect(config1).not.toEqual(config2);
    });

    it('config has all required fields', () => {
      const config = getFireworkConfig(0);
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('x');
      expect(config).toHaveProperty('y');
      expect(config).toHaveProperty('delay');
      expect(config).toHaveProperty('scale');
    });

    it('delay increases with index (staggered)', () => {
      const config1 = getFireworkConfig(1);
      const config2 = getFireworkConfig(2);
      expect(config2.delay).toBeGreaterThan(config1.delay);
    });

    it('scale is in range 0.5 to 1.0', () => {
      const config = getFireworkConfig(0);
      expect(config.scale).toBeGreaterThanOrEqual(0.5);
      expect(config.scale).toBeLessThanOrEqual(1.0);
    });
  });
});