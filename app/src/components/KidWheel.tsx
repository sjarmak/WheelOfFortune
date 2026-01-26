/**
 * Kid-Friendly Wheel Component
 *
 * A colorful, animated wheel with positive outcomes only:
 * - REVEAL! - Reveal a letter
 * - DOUBLE! - Reveal two letters
 * - PICK ONE - Choose from suggestions
 * - BONUS STARS - Get extra stars
 * - FREE HINT - Get a hint token
 * - SPARKLE! - Fun animation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { KidWedgeOutcome, KID_WHEEL_CONFIG } from '../engine/kidTypes';
import { getKidWheelOutcome } from '../engine/kidGame';
import { getShopItem } from '../engine/shopTypes';

interface KidWheelProps {
  onSpinStart: () => void;
  onSpinComplete: (outcome: KidWedgeOutcome) => void;
  isSpinning: boolean;
  seed: number;
  canSpin: boolean;
  wheelThemeId?: string | null; // Equipped wheel theme ID
}

const WEDGE_COUNT = KID_WHEEL_CONFIG.length;
const WEDGE_ANGLE = 360 / WEDGE_COUNT;

export const KidWheel: React.FC<KidWheelProps> = ({
  onSpinStart,
  onSpinComplete,
  seed,
  canSpin,
  wheelThemeId
}) => {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const wheelRef = useRef<SVGSVGElement>(null);
  const startY = useRef(0);
  const startRotation = useRef(0);

  // Get custom wheel colors from equipped theme
  const themeColors = wheelThemeId ? getShopItem(wheelThemeId)?.wheelColors : null;

  const handleSpin = useCallback(() => {
    if (!canSpin || isAnimating) return;

    setIsAnimating(true);
    onSpinStart();

    // Get deterministic outcome
    const outcome = getKidWheelOutcome(seed);
    const outcomeIndex = KID_WHEEL_CONFIG.indexOf(outcome);

    // Calculate rotation to land on this wedge
    const baseRotation = 360 * 5; // 5 full spins
    const wedgeRotation = outcomeIndex * WEDGE_ANGLE;
    const finalRotation = rotation + baseRotation + (360 - wedgeRotation) + (WEDGE_ANGLE / 2);

    setRotation(finalRotation);

    // Complete after animation
    setTimeout(() => {
      setIsAnimating(false);
      onSpinComplete(outcome);
    }, 4000);
  }, [canSpin, isAnimating, onSpinStart, onSpinComplete, seed, rotation]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canSpin || isAnimating) return;
    startY.current = e.touches[0].clientY;
    startRotation.current = rotation;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!canSpin || isAnimating) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY.current - endY;

    if (Math.abs(deltaY) > 50) {
      handleSpin();
    }
  };

  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const animationDuration = reduceMotion ? '0.5s' : '4s';
  const animationEasing = reduceMotion ? 'ease-out' : 'cubic-bezier(0.25, 0.1, 0.25, 1)';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Wheel */}
      <svg
        ref={wheelRef}
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isAnimating ? `transform ${animationDuration} ${animationEasing}` : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Wedges */}
        {KID_WHEEL_CONFIG.map((wedge, i) => {
          const startAngle = i * WEDGE_ANGLE;
          const endAngle = startAngle + WEDGE_ANGLE;
          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;

          const x1 = 100 + 95 * Math.cos(startRad);
          const y1 = 100 + 95 * Math.sin(startRad);
          const x2 = 100 + 95 * Math.cos(endRad);
          const y2 = 100 + 95 * Math.sin(endRad);

          // Position emoji in center of wedge
          const midAngle = startAngle + WEDGE_ANGLE / 2;
          const midRad = (midAngle - 90) * Math.PI / 180;
          const emojiX = 100 + 60 * Math.cos(midRad);
          const emojiY = 100 + 60 * Math.sin(midRad);

          // Use theme color if available, otherwise use default wedge color
          const wedgeColor = themeColors ? themeColors[i % themeColors.length] : wedge.color;

          return (
            <g key={wedge.type + i}>
              {/* Wedge slice */}
              <path
                d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                fill={wedgeColor}
                stroke="#333"
                strokeWidth="1"
              />
              {/* Big emoji only */}
              <text
                x={emojiX}
                y={emojiY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
              >
                {wedge.emoji}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx="100" cy="100" r="25" fill="#FFD700" stroke="#B8860B" strokeWidth="3" />

        {/* Center button */}
        {!isAnimating && (
          <g onClick={handleSpin} style={{ cursor: canSpin ? 'pointer' : 'not-allowed' }}>
            <circle cx="100" cy="100" r="22" fill={canSpin ? '#FF6B6B' : '#888'} />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontWeight="bold"
              fill="white"
            >
              SPIN!
            </text>
          </g>
        )}
      </svg>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-600 drop-shadow-lg" />
      </div>
    </div>
  );
};
