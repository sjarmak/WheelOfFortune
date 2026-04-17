import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { StandardWheel } from '../StandardWheel';
import { WHEEL_CONFIG } from '../../engine/types';

/**
 * These tests verify the Web Animations API spin path and the spinId
 * dispatch-once guard. jsdom does not implement `Element.prototype.animate`,
 * so we install a controllable mock per-test that lets us:
 *   - assert `animate()` was called with rotation keyframes
 *   - control WHEN `animation.finished` resolves
 *
 * That lets us prove: even with N rapid clicks, `onSpinComplete` fires
 * exactly once.
 */

interface MockAnimation {
  finished: Promise<MockAnimation>;
  resolve: () => void;
  cancel: () => void;
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null;
  options?: number | KeyframeAnimationOptions;
}

function installAnimateMock(): {
  calls: MockAnimation[];
  restore: () => void;
} {
  const calls: MockAnimation[] = [];
  const original = (Element.prototype as unknown as { animate?: unknown }).animate;

  (Element.prototype as unknown as { animate: unknown }).animate = function mockAnimate(
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    let resolveFn: (a: MockAnimation) => void = () => {};
    let rejectFn: (r?: unknown) => void = () => {};
    const finished = new Promise<MockAnimation>((res, rej) => {
      resolveFn = res;
      rejectFn = rej;
    });
    const anim: MockAnimation = {
      finished,
      keyframes,
      options,
      resolve: () => resolveFn(anim),
      cancel: () => rejectFn(new DOMException('cancel', 'AbortError')),
    };
    calls.push(anim);
    return anim as unknown as Animation;
  };

  return {
    calls,
    restore: () => {
      (Element.prototype as unknown as { animate: unknown }).animate =
        original as unknown;
    },
  };
}

describe('StandardWheel — Web Animations API spin', () => {
  let mock: ReturnType<typeof installAnimateMock>;

  beforeEach(() => {
    mock = installAnimateMock();
  });

  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it('calls element.animate with rotation keyframes when clicked', () => {
    const onSpinStart = vi.fn();
    const onSpinComplete = vi.fn();
    const { getByTestId } = render(
      <StandardWheel
        seed={42}
        onSpinStart={onSpinStart}
        onSpinComplete={onSpinComplete}
      />,
    );

    fireEvent.click(getByTestId('standard-wheel'));

    expect(mock.calls.length).toBe(1);
    expect(onSpinStart).toHaveBeenCalledTimes(1);

    const { keyframes, options } = mock.calls[0];
    // Keyframes must be a 2-element array with CSS rotate transforms.
    expect(Array.isArray(keyframes)).toBe(true);
    const kfArr = keyframes as Keyframe[];
    expect(kfArr.length).toBe(2);
    expect(String(kfArr[0].transform)).toMatch(/rotate\(.+deg\)/);
    expect(String(kfArr[1].transform)).toMatch(/rotate\(.+deg\)/);

    // Options must specify duration + easing + forwards fill.
    expect(typeof options).toBe('object');
    const opts = options as KeyframeAnimationOptions;
    expect(opts.duration).toBeGreaterThan(0);
    expect(opts.easing).toMatch(/cubic-bezier/);
    expect(opts.fill).toBe('forwards');
  });

  it('fires onSpinComplete exactly once when animation.finished resolves', async () => {
    const onSpinComplete = vi.fn();
    const { getByTestId } = render(
      <StandardWheel seed={7} onSpinComplete={onSpinComplete} />,
    );

    fireEvent.click(getByTestId('standard-wheel'));
    expect(mock.calls.length).toBe(1);

    await act(async () => {
      mock.calls[0].resolve();
      await mock.calls[0].finished;
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onSpinComplete).toHaveBeenCalledTimes(1);
    const [wedge, index] = onSpinComplete.mock.calls[0];
    expect(WHEEL_CONFIG).toContain(wedge);
    expect(typeof index).toBe('number');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(WHEEL_CONFIG.length);
  });

  it('ignores rapid re-clicks while a spin is in flight (spinId guard)', async () => {
    const onSpinStart = vi.fn();
    const onSpinComplete = vi.fn();
    const { getByTestId } = render(
      <StandardWheel
        seed={99}
        onSpinStart={onSpinStart}
        onSpinComplete={onSpinComplete}
      />,
    );

    const wheel = getByTestId('standard-wheel');

    // Fire 5 rapid clicks.
    fireEvent.click(wheel);
    fireEvent.click(wheel);
    fireEvent.click(wheel);
    fireEvent.click(wheel);
    fireEvent.click(wheel);

    // Only ONE animation should have been dispatched.
    expect(mock.calls.length).toBe(1);
    expect(onSpinStart).toHaveBeenCalledTimes(1);

    // Resolve it.
    await act(async () => {
      mock.calls[0].resolve();
      await mock.calls[0].finished;
      await Promise.resolve();
      await Promise.resolve();
    });

    // And onSpinComplete fires exactly once.
    expect(onSpinComplete).toHaveBeenCalledTimes(1);
  });

  it('does not spin when canSpin={false}', () => {
    const onSpinComplete = vi.fn();
    const { getByTestId } = render(
      <StandardWheel seed={1} canSpin={false} onSpinComplete={onSpinComplete} />,
    );

    fireEvent.click(getByTestId('standard-wheel'));
    expect(mock.calls.length).toBe(0);
    expect(onSpinComplete).not.toHaveBeenCalled();
  });

  it('supports consecutive spins after completion', async () => {
    const onSpinComplete = vi.fn();
    const { getByTestId } = render(
      <StandardWheel seed={123} onSpinComplete={onSpinComplete} />,
    );

    const wheel = getByTestId('standard-wheel');

    // First spin.
    fireEvent.click(wheel);
    expect(mock.calls.length).toBe(1);
    await act(async () => {
      mock.calls[0].resolve();
      await mock.calls[0].finished;
      await Promise.resolve();
      await Promise.resolve();
    });

    // Second spin.
    fireEvent.click(wheel);
    expect(mock.calls.length).toBe(2);
    await act(async () => {
      mock.calls[1].resolve();
      await mock.calls[1].finished;
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onSpinComplete).toHaveBeenCalledTimes(2);
  });
});
