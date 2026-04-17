/**
 * Minimal standalone harness for the Playwright WebKit e2e test.
 *
 * Renders only <StandardWheel /> so the test is independent of App.tsx, which
 * is being modified by parallel work units.
 *
 * Exposes a handful of hooks on window.__wheel for the Playwright test:
 *   - __wheel.spinResults : Array<{ index: number; label: string }>
 *   - __wheel.spinCount   : number
 *   - __wheel.reset()     : clear recorded results
 *   - __wheel.bumpSeed()  : change the seed so subsequent spins vary
 */
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StandardWheel } from '../../../src/components/StandardWheel';
import { WheelWedge } from '../../../src/engine/types';

interface SpinRecord {
  index: number;
  label: string;
}

declare global {
  interface Window {
    __wheel: {
      spinResults: SpinRecord[];
      spinCount: number;
      reset: () => void;
      bumpSeed: () => void;
    };
  }
}

function Harness() {
  const [seed, setSeed] = useState(1);
  const resultsRef = useRef<SpinRecord[]>([]);
  const [, force] = useState(0);

  const onSpinComplete = useCallback(
    (wedge: WheelWedge, wedgeIndex: number) => {
      resultsRef.current = [
        ...resultsRef.current,
        { index: wedgeIndex, label: wedge.label },
      ];
      window.__wheel.spinResults = resultsRef.current;
      window.__wheel.spinCount = resultsRef.current.length;
      force((n) => n + 1);
    },
    [],
  );

  // Keep the window hook fresh on every render so bumpSeed works.
  window.__wheel = {
    spinResults: resultsRef.current,
    spinCount: resultsRef.current.length,
    reset: () => {
      resultsRef.current = [];
      window.__wheel.spinResults = resultsRef.current;
      window.__wheel.spinCount = 0;
      force((n) => n + 1);
    },
    bumpSeed: () => setSeed((s) => s + 1),
  };

  return (
    <div>
      <StandardWheel seed={seed} onSpinComplete={onSpinComplete} />
      <pre id="log">
        {JSON.stringify(
          {
            seed,
            spinCount: resultsRef.current.length,
            results: resultsRef.current,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

const mount = document.getElementById('wheel-mount');
if (mount) {
  createRoot(mount).render(<Harness />);
}
