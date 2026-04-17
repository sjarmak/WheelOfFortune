import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';
import { SeededRNG } from '../engine/rng';

interface WheelProps {
  onSpinStart: () => void;
  onSpinComplete: (wedge: WheelWedge) => void;
  isSpinning: boolean;
  seed: number;
  canSpin?: boolean;
}

const WEDGE_COUNT = WHEEL_CONFIG.length; // 24 wedges
const WEDGE_ANGLE = 360 / WEDGE_COUNT;   // 15 degrees each
const MIN_SWIPE_VELOCITY = 0.5; // Minimum velocity to trigger spin

export const Wheel: React.FC<WheelProps> = ({ 
  onSpinStart, 
  onSpinComplete, 
  isSpinning, 
  seed, 
  canSpin = true 
}) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Touch tracking state
  const touchStartRef = useRef<{ x: number; y: number; time: number; angle: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Calculate angle from touch point relative to wheel center
  const getTouchAngle = (clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const triggerSpin = () => {
    if (isSpinning || !canSpin) return;

    // 1. Pick random wedge using seeded RNG
    const rng = new SeededRNG(seed);
    const winningIndex = rng.range(0, WEDGE_COUNT);
    const winningWedge = WHEEL_CONFIG[winningIndex];

    onSpinStart();

    // 2. Calculate target rotation
    const wedgeCenterOffset = winningIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2;
    const landingAngle = (360 - wedgeCenterOffset) % 360;
    const currentAngle = rotation % 360;
    
    let delta = landingAngle - currentAngle;
    if (delta < 0) delta += 360;
    
    const extraSpins = 5;
    const spinAmount = extraSpins * 360 + delta;
    
    setRotation(rotation + spinAmount);

    // 3. Report result after animation
    setTimeout(() => {
      onSpinComplete(winningWedge);
    }, 4000);
  };

  // Touch handlers for swipe-to-spin
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSpinning || !canSpin) return;
    
    const touch = e.touches[0];
    const angle = getTouchAngle(touch.clientX, touch.clientY);
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      angle
    };
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSpinning || !canSpin || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = () => {
    if (isSpinning || !canSpin) return;
    
    const start = touchStartRef.current;
    const end = lastTouchRef.current;
    
    if (!start || !end) return;
    
    const timeDelta = (end.time - start.time) / 1000; // seconds
    if (timeDelta <= 0) return;
    
    // Calculate swipe distance
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate velocity (pixels per second)
    const velocity = distance / timeDelta;
    
    // If swipe was fast enough, trigger spin
    if (velocity > MIN_SWIPE_VELOCITY * 100) {
      triggerSpin();
    }
    
    // Reset touch state
    touchStartRef.current = null;
    lastTouchRef.current = null;
  };

  return (
    <div className={clsx("relative mx-auto w-full max-w-[260px] sm:max-w-sm aspect-square touch-none", !canSpin && "pointer-events-none")}>
      {/* Pointer at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md" />

      {/* Wheel */}
      <div
        ref={wheelRef}
        className="w-full h-full rounded-full border-8 border-yellow-600 shadow-2xl overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={triggerSpin}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Draw wedges starting from top, going clockwise */}
          {WHEEL_CONFIG.map((wedge, i) => {
            const startAngle = (i * WEDGE_ANGLE - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * WEDGE_ANGLE - 90) * (Math.PI / 180);
            const x1 = 50 + 50 * Math.cos(startAngle);
            const y1 = 50 + 50 * Math.sin(startAngle);
            const x2 = 50 + 50 * Math.cos(endAngle);
            const y2 = 50 + 50 * Math.sin(endAngle);

            return (
              <path
                key={wedge.id}
                d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                fill={wedge.color}
                stroke="#333"
                strokeWidth="0.2"
              />
            );
          })}

          {/* Center circles */}
          <circle cx="50" cy="50" r="50" fill="transparent" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#888" stroke="#555" strokeWidth="1" />

          {/* Text labels */}
          <defs>
            {WHEEL_CONFIG.map((wedge, i) => {
              const midAngle = (i * WEDGE_ANGLE + WEDGE_ANGLE / 2 - 90 - 3) * (Math.PI / 180);
              const x1 = 50 + 44 * Math.cos(midAngle);
              const y1 = 50 + 44 * Math.sin(midAngle);
              const x2 = 50 + 16 * Math.cos(midAngle);
              const y2 = 50 + 16 * Math.sin(midAngle);

              return (
                <path
                  key={`path-${wedge.id}`}
                  id={`path-${wedge.id}`}
                  d={`M${x1},${y1} L${x2},${y2}`}
                  fill="none"
                />
              );
            })}
          </defs>

          {WHEEL_CONFIG.map((wedge) => {
            const isSpecial = wedge.type === 'BANKRUPT' || wedge.type === 'LOSE_TURN';
            const textColor = wedge.type === 'BANKRUPT' ? '#fff' : 
                              wedge.type === 'LOSE_TURN' ? '#000' : '#000';
            return (
              <text
                key={`label-${wedge.id}`}
                fontSize={isSpecial ? '3' : '4'}
                fontWeight="bold"
                fill={textColor}
                style={{ pointerEvents: 'none' }}
                lengthAdjust="spacingAndGlyphs"
              >
                <textPath 
                  href={`#path-${wedge.id}`} 
                  startOffset="50%" 
                  textAnchor="middle"
                  lengthAdjust="spacingAndGlyphs"
                >
                  {wedge.label}
                </textPath>
              </text>
            );
          })}
        </svg>
      </div>

      {/* Spin button */}
      <button
        onClick={triggerSpin}
        disabled={isSpinning || !canSpin}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-game-accent border-2 border-white flex items-center justify-center z-10 hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-[10px] font-bold text-white">SPIN</span>
      </button>
    </div>
  );
};
