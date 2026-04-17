/**
 * Standard Mode Wheel Component (Web / DOM)
 *
 * - 24-wedge SVG wheel with BANKRUPT / LOSE_TURN.
 * - Uses Web Animations API (`element.animate(...).finished` Promise) to drive
 *   the spin rotation. We explicitly avoid `transitionend` because Safari's
 *   compositor can drop that event mid-animation, causing the wheel to hang.
 * - Dispatch-once guarded via a monotonically-increasing `spinId` ref so that
 *   only the most recent spin fires `onSpinComplete`.
 * - Touch handlers (touchstart/move/end) with `{ passive: true }` + the
 *   `touch-action: pan-y` CSS hint let iPad Safari handle the gesture without
 *   hijacking it for scroll.
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';
import { SeededRNG } from '../engine/rng';

export interface StandardWheelProps {
  onSpinStart?: () => void;
  onSpinComplete?: (wedge: WheelWedge, wedgeIndex: number) => void;
  isSpinning?: boolean;
  seed: number;
  canSpin?: boolean;
}

const WEDGE_COUNT = WHEEL_CONFIG.length; // 24
const WEDGE_ANGLE = 360 / WEDGE_COUNT; // 15deg
const SPIN_DURATION_MS = 4000;
const SPIN_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
const EXTRA_SPINS = 5;
const MIN_SWIPE_DISTANCE_PX = 40;

/**
 * Compute the final CSS rotation (degrees) that places `winningIndex` at the
 * top pointer. Mirrors the formula in the existing Wheel.tsx so visual landing
 * matches.
 */
function computeFinalRotation(
  currentRotation: number,
  winningIndex: number,
): number {
  const wedgeCenterOffset = winningIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2;
  const landingAngle = (360 - wedgeCenterOffset) % 360;
  const currentAngle = ((currentRotation % 360) + 360) % 360;
  let delta = landingAngle - currentAngle;
  if (delta < 0) delta += 360;
  const spinAmount = EXTRA_SPINS * 360 + delta;
  return currentRotation + spinAmount;
}

export const StandardWheel: React.FC<StandardWheelProps> = ({
  onSpinStart,
  onSpinComplete,
  seed,
  canSpin = true,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Mutable state we don't want to trigger re-renders for.
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rotationRef = useRef(0);
  const spinIdRef = useRef(0);
  const currentAnimationRef = useRef<Animation | null>(null);

  // Touch tracking.
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const touchLastRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  // Cleanup any in-flight animation on unmount so we never resolve `finished`
  // against a stale node.
  useEffect(() => {
    return () => {
      const anim = currentAnimationRef.current;
      if (anim) {
        try {
          anim.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const spin = useCallback(() => {
    if (!canSpin || isAnimating) return;
    const element = svgRef.current;
    if (!element || typeof element.animate !== 'function') return;

    // Bump spinId so any previous spin's `finished` handler (if it somehow
    // resolves later) is ignored.
    spinIdRef.current += 1;
    const mySpinId = spinIdRef.current;

    // Deterministic outcome (matches Wheel.tsx so the behavior is consistent).
    const rng = new SeededRNG(seed);
    const winningIndex = rng.range(0, WEDGE_COUNT);

    const startRotation = rotationRef.current;
    const finalRotation = computeFinalRotation(startRotation, winningIndex);

    setIsAnimating(true);
    onSpinStart?.();

    const animation = element.animate(
      [
        { transform: `rotate(${startRotation}deg)` },
        { transform: `rotate(${finalRotation}deg)` },
      ],
      {
        duration: SPIN_DURATION_MS,
        easing: SPIN_EASING,
        fill: 'forwards',
      },
    );
    currentAnimationRef.current = animation;

    // The `finished` Promise is the ONLY completion signal.
    animation.finished
      .then(() => {
        // Only the most recent spin should fire onSpinComplete. If another
        // spin has started since, bail out silently.
        if (mySpinId !== spinIdRef.current) return;
        rotationRef.current = finalRotation;
        setIsAnimating(false);
        currentAnimationRef.current = null;
        const wedge = WHEEL_CONFIG[winningIndex];
        onSpinComplete?.(wedge, winningIndex);
      })
      .catch(() => {
        // Animation was cancelled (e.g. unmount). No completion dispatch.
        if (mySpinId === spinIdRef.current) {
          setIsAnimating(false);
          currentAnimationRef.current = null;
        }
      });
  }, [canSpin, isAnimating, seed, onSpinStart, onSpinComplete]);

  // --- Touch handlers (iPad-tuned) ---
  // React's synthetic touch handlers are already "passive-compatible" for our
  // use (we never call preventDefault), so we attach them directly. The
  // `touchAction: 'pan-y'` style hint prevents Safari from swallowing the
  // vertical swipe for native scroll gestures.
  const onTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!canSpin || isAnimating) return;
      const t = e.touches[0];
      if (!t) return;
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now(),
      };
      touchLastRef.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now(),
      };
    },
    [canSpin, isAnimating],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!touchStartRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      touchLastRef.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now(),
      };
    },
    [],
  );

  const onTouchEnd = useCallback(() => {
    const start = touchStartRef.current;
    const end = touchLastRef.current;
    touchStartRef.current = null;
    touchLastRef.current = null;
    if (!start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= MIN_SWIPE_DISTANCE_PX) {
      spin();
    }
  }, [spin]);

  // --- Wedge geometry (static SVG; only the outer element rotates) ---
  // Wedges end at r=47 so the gold rim (r=48, strokeWidth=3) sits just
  // outside and wraps the wheel. Mirrors ios/src/components/StandardWheel.tsx
  // (normalized from 200→100 viewBox): text path r=45.5→r=11.5 along a line
  // shifted -5° from the wedge midline, with per-label startOffset tuning
  // (35% for $ values pushes them outward; 42% BANKRUPT / 50% LOSE A TURN
  // recenter the longer words).
  const wedges = WHEEL_CONFIG.map((wedge, i) => {
    const startAngle = (i * WEDGE_ANGLE - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * WEDGE_ANGLE - 90) * (Math.PI / 180);
    const x1 = 50 + 47 * Math.cos(startAngle);
    const y1 = 50 + 47 * Math.sin(startAngle);
    const x2 = 50 + 47 * Math.cos(endAngle);
    const y2 = 50 + 47 * Math.sin(endAngle);
    const midAngle =
      (i * WEDGE_ANGLE + WEDGE_ANGLE / 2 - 90 - 5) * (Math.PI / 180);
    const tx1 = 50 + 45.5 * Math.cos(midAngle);
    const ty1 = 50 + 45.5 * Math.sin(midAngle);
    const tx2 = 50 + 11.5 * Math.cos(midAngle);
    const ty2 = 50 + 11.5 * Math.sin(midAngle);
    const isSpecial =
      wedge.type === 'BANKRUPT' ||
      wedge.type === 'LOSE_TURN';
    const textColor = wedge.type === 'BANKRUPT' ? '#fff' : '#000';
    const textOffset =
      wedge.type === 'LOSE_TURN'
        ? '50%'
        : wedge.type === 'BANKRUPT'
          ? '42%'
          : '35%';
    return {
      id: wedge.id,
      label: wedge.label,
      color: wedge.color,
      isSpecial,
      textColor,
      textOffset,
      wedgePath: `M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`,
      textPath: `M${tx1},${ty1} L${tx2},${ty2}`,
    };
  });

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 360,
    aspectRatio: '1 / 1',
    margin: '0 auto',
    touchAction: 'pan-y',
  };

  const svgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    touchAction: 'pan-y',
    transform: `rotate(${rotationRef.current}deg)`,
    transformOrigin: '50% 50%',
  };

  return (
    <div
      style={containerStyle}
      data-testid="standard-wheel-container"
    >
      {/* Pointer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '18px solid white',
          zIndex: 2,
        }}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        style={svgStyle}
        role="button"
        aria-label="Spin the wheel"
        data-testid="standard-wheel"
        data-spinning={isAnimating ? 'true' : 'false'}
        data-spin-id={spinIdRef.current}
        onClick={spin}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          {wedges.map((w) => (
            <path key={`p-${w.id}`} id={`sw-path-${w.id}`} d={w.textPath} fill="none" />
          ))}
        </defs>

        {wedges.map((w) => (
          <path
            key={`wedge-${w.id}`}
            d={w.wedgePath}
            fill={w.color}
            stroke="#222"
            strokeWidth="0.15"
          />
        ))}

        {wedges.map((w) => (
          <text
            key={`label-${w.id}`}
            fontSize={w.isSpecial ? '4' : '7'}
            fontWeight="900"
            fill={w.textColor}
            style={{ pointerEvents: 'none' }}
          >
            <textPath
              href={`#sw-path-${w.id}`}
              startOffset={w.textOffset}
              textAnchor="middle"
            >
              {w.label}
            </textPath>
          </text>
        ))}

        {/* Gold rim */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#C9A84C" strokeWidth="3" />
        {/* Center hub */}
        <circle cx="50" cy="50" r="10" fill="#888" stroke="#555" strokeWidth="0.5" />
        {/* SPIN label on center hub */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="3.2"
          fontWeight="900"
          fill="#fff"
          style={{ pointerEvents: 'none', letterSpacing: '0.05em' }}
        >
          SPIN
        </text>
      </svg>
    </div>
  );
};

export default StandardWheel;
