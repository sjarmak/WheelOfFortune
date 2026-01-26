import { describe, it, expect } from 'vitest';
import {
  WALK_FRAMES,
  HAIR_COLOR,
  FACE_COLOR,
  EYE_COLOR,
  DRESS_COLOR,
  FLESH_COLOR,
  SHOE_COLOR,
  SPARKLE_COLOR,
  PIXEL,
  DANCE_FRAME_TIME,
  FRAME_COUNT,
  SPARKLE_COUNT,
  SPARKLE_RADIUS,
  calculateDanceBounce,
  getFrameIndex,
  getLimbOffset,
  calculateSparkleAngle,
  calculateSparklePosition,
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

    it('sparkles are gold (#FFD700)', () => {
      expect(SPARKLE_COLOR).toBe('#FFD700');
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

    it('SPARKLE_COUNT is 6', () => {
      expect(SPARKLE_COUNT).toBe(6);
    });

    it('SPARKLE_RADIUS is 20px', () => {
      expect(SPARKLE_RADIUS).toBe(20);
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
      // Frame 0: ~0, Frame 1: ~4, Frame 2: ~0, Frame 3: ~-4, Frame 4: ~0
      expect(values[0]).toBeCloseTo(0, 5);
      expect(values[1]).toBeCloseTo(4, 5);
      expect(values[2]).toBeCloseTo(0, 5);
      expect(values[3]).toBeCloseTo(-4, 5);
      expect(values[4]).toBeCloseTo(0, 5);
    });

    it('handles fractional frame progress smoothly', () => {
      const mid = calculateDanceBounce(0.5);
      // sin(0.5 * PI/2) = sin(PI/4) ≈ 0.707 * 4 ≈ 2.828
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
      // Frame 0: leftArm = -2, so dance = -2 * 2 = -4
      expect(getLimbOffset(0, 'leftArm', true)).toBe(-4);
      // Frame 0: rightArm = 1, so dance = 1 * 2 = 2
      expect(getLimbOffset(0, 'rightArm', true)).toBe(2);
    });

    it('multiplies leg offsets by 1.5 in dance mode', () => {
      // Frame 0: leftLeg = -2, so dance = -2 * 1.5 = -3
      expect(getLimbOffset(0, 'leftLeg', true)).toBe(-3);
      // Frame 0: rightLeg = 1, so dance = 1 * 1.5 = 1.5
      expect(getLimbOffset(0, 'rightLeg', true)).toBe(1.5);
    });

    it('returns 0 for neutral frames in dance mode too', () => {
      expect(getLimbOffset(1, 'leftArm', true)).toBe(0);
      expect(getLimbOffset(1, 'leftLeg', true)).toBe(0);
    });

    it('handles frame wrapping via getFrameIndex', () => {
      // Frame 4 wraps to 0
      expect(getLimbOffset(4, 'leftLeg', false)).toBe(getLimbOffset(0, 'leftLeg', false));
    });
  });

  describe('calculateSparkleAngle', () => {
    it('first sparkle at 0 radians', () => {
      expect(calculateSparkleAngle(0)).toBeCloseTo(0, 10);
    });

    it('sparkles are evenly distributed around the circle', () => {
      const angles = Array.from({ length: 6 }, (_, i) => calculateSparkleAngle(i));
      const expectedStep = (Math.PI * 2) / 6;

      for (let i = 1; i < angles.length; i++) {
        expect(angles[i] - angles[i - 1]).toBeCloseTo(expectedStep, 10);
      }
    });

    it('last sparkle is just before 2*PI (full circle)', () => {
      const lastAngle = calculateSparkleAngle(5);
      expect(lastAngle).toBeCloseTo((5 / 6) * Math.PI * 2, 10);
      expect(lastAngle).toBeLessThan(Math.PI * 2);
    });

    it('produces 6 unique angles', () => {
      const angles = Array.from({ length: 6 }, (_, i) => calculateSparkleAngle(i));
      const unique = new Set(angles.map(a => a.toFixed(6)));
      expect(unique.size).toBe(6);
    });
  });

  describe('calculateSparklePosition', () => {
    it('at progress 0 with no delay, position is at center', () => {
      const pos = calculateSparklePosition(0, 0, 0);
      expect(pos.x).toBeCloseTo(0, 10);
      expect(pos.y).toBeCloseTo(0, 10);
    });

    it('at full progress, position is at radius along angle', () => {
      const angle = 0;
      const pos = calculateSparklePosition(angle, 1, 0);
      expect(pos.x).toBeCloseTo(SPARKLE_RADIUS, 5);
      expect(pos.y).toBeCloseTo(0, 5);
    });

    it('at full progress with 90-degree angle, moves in y direction', () => {
      const angle = Math.PI / 2;
      const pos = calculateSparklePosition(angle, 1, 0);
      expect(pos.x).toBeCloseTo(0, 5);
      expect(pos.y).toBeCloseTo(SPARKLE_RADIUS, 5);
    });

    it('opacity starts at 1 and ends at 0', () => {
      const start = calculateSparklePosition(0, 0, 0);
      const end = calculateSparklePosition(0, 1, 0);
      expect(start.opacity).toBe(1);
      expect(end.opacity).toBe(0);
    });

    it('scale starts at 1 and ends at 0', () => {
      const start = calculateSparklePosition(0, 0, 0);
      const end = calculateSparklePosition(0, 1, 0);
      expect(start.scale).toBe(1);
      expect(end.scale).toBe(0);
    });

    it('delay shifts the animation start', () => {
      const delay = 0.2;
      // At progress = delay, sparkle is still at start
      const atDelay = calculateSparklePosition(0, delay, delay);
      expect(atDelay.x).toBeCloseTo(0, 5);
      expect(atDelay.opacity).toBe(1);
    });

    it('delay does not produce negative progress', () => {
      // Progress < delay means sparkle hasn't started yet
      const pos = calculateSparklePosition(0, 0.1, 0.5);
      expect(pos.x).toBeCloseTo(0, 10);
      expect(pos.y).toBeCloseTo(0, 10);
      expect(pos.opacity).toBe(1);
      expect(pos.scale).toBe(1);
    });

    it('progress capped at 1 even when progress - delay > 1', () => {
      const pos = calculateSparklePosition(0, 2.0, 0);
      // adjustedProgress capped at 1
      expect(pos.x).toBeCloseTo(SPARKLE_RADIUS, 5);
      expect(pos.opacity).toBe(0);
      expect(pos.scale).toBe(0);
    });
  });
});
