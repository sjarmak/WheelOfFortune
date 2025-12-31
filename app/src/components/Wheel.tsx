import React, { useRef, useState, useEffect } from 'react';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';
import clsx from 'clsx';

interface WheelProps {
  onSpinStart: () => void;
  onSpinComplete: (wedge: WheelWedge) => void;
  isSpinning: boolean;
  seed: number; // Used to determine result deterministically from outside or we pick here
}

export const Wheel: React.FC<WheelProps> = ({ onSpinStart, onSpinComplete, isSpinning, seed }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Calculate wedge angle size
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  const spin = () => {
    if (isSpinning) return;
    
    onSpinStart();

    // Determine result index deterministically or randomly (for visual sync, we need the result *now*)
    // In a real seeded app, the engine tells us what the result IS, then we animate TO it.
    // For simplicity here, we'll pick a random wedge locally using Math.random (or seeded if provided) 
    // BUT since the engine needs to know, we should probably let the parent pass the target or handle it here.
    
    // Let's assume we pick here and report back.
    const randomIndex = Math.floor(Math.random() * WHEEL_CONFIG.length);
    const targetWedge = WHEEL_CONFIG[randomIndex];
    
    // Calculate new rotation
    // We want to spin at least 3 times (1080) + offset to target
    // Target is at index `randomIndex`.
    // If index 0 is at 0 degrees (top), then index i is at i * wedgeAngle.
    // To land on index i under the pointer (assume pointer at top 0deg), we need to rotate NEGATIVE or specific amount.
    // Actually, usually 0 is at 3 o'clock or 12 o'clock in CSS. Let's assume 0 is 12 o'clock.
    // To bring wedge i to 12 o'clock, we rotate by - (i * wedgeAngle).
    // Add extra spins.
    
    const extraSpins = 5;
    const baseRotation = 360 * extraSpins;
    const targetRotation = -(randomIndex * wedgeAngle);
    // Add randomness within the wedge to not always hit center
    const jitter = (Math.random() - 0.5) * (wedgeAngle * 0.8);
    
    const newTotalRotation = rotation + baseRotation + targetRotation + jitter; // Simplified additive rotation
    
    setRotation(newTotalRotation); // This triggers CSS transition

    setTimeout(() => {
      onSpinComplete(targetWedge);
    }, 4000); // Match CSS duration
  };

  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto my-4">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md" />

      {/* Wheel Container */}
      <div 
        ref={wheelRef}
        className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={spin}
      >
        {WHEEL_CONFIG.map((wedge, i) => (
          <div
            key={wedge.id}
            className="absolute top-0 left-1/2 w-full h-full origin-bottom-left"
            style={{
              transform: `rotate(${i * wedgeAngle}deg) skewY(-${90 - wedgeAngle}deg)`,
              transformOrigin: '50% 50%'
            }}
          >
             {/* Use a proper conic gradient or SVG for better wedges, but div hacking: */}
             {/* This is hard with pure divs. SVG is better. Switching to SVG wheel. */}
          </div>
        ))}
        {/* SVG Overlay for drawing wedges properly */}
        <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          {WHEEL_CONFIG.map((wedge, i) => {
            // Calculate SVG path for wedge
            const startAngle = (i * wedgeAngle) * Math.PI / 180;
            const endAngle = ((i + 1) * wedgeAngle) * Math.PI / 180;
            const x1 = 50 + 50 * Math.cos(startAngle);
            const y1 = 50 + 50 * Math.sin(startAngle);
            const x2 = 50 + 50 * Math.cos(endAngle);
            const y2 = 50 + 50 * Math.sin(endAngle);
            
            return (
              <path
                key={wedge.id}
                d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                fill={wedge.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        
        {/* Labels - harder to place in SVG efficiently without calcs, doing simple overlay */}
        {WHEEL_CONFIG.map((wedge, i) => (
           <div
             key={`label-${i}`}
             className="absolute w-full text-center text-[10px] font-bold text-black"
             style={{
               top: '50%',
               left: '50%',
               transform: `translate(-50%, -50%) rotate(${i * wedgeAngle + wedgeAngle/2}deg) translate(35%) rotate(90deg)`,
               width: '40px'
             }}
           >
             {wedge.label}
           </div>
        ))}
      </div>
      
      {/* Center Cap */}
      <button 
        onClick={spin}
        disabled={isSpinning}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-game-accent border-2 border-white flex items-center justify-center z-10 hover:scale-110 active:scale-95 transition-transform"
      >
        <span className="text-[10px] font-bold text-white">SPIN</span>
      </button>
    </div>
  );
};
