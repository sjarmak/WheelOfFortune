import '@testing-library/jest-dom';

// jsdom does not implement Web Animations API (Element.prototype.animate).
// Provide a minimal mock so components that spin via `element.animate(...).finished`
// work in unit tests. The mock resolves `finished` on the next microtask so
// we can await completion deterministically.
if (typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).animate = function mockAnimate(
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    _options?: number | KeyframeAnimationOptions,
  ) {
    let resolveFinished: (value: Animation) => void = () => {};
    let rejectFinished: (reason?: unknown) => void = () => {};
    const finished = new Promise<Animation>((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
    const animation = {
      finished,
      cancel() {
        rejectFinished(new DOMException('The user aborted a request.', 'AbortError'));
      },
      play() {},
      pause() {},
      reverse() {},
    } as unknown as Animation;
    // Resolve on next microtask so callers can wire handlers first.
    Promise.resolve().then(() => resolveFinished(animation));
    return animation;
  };
}
