import React, { useRef, useState } from 'react';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';

interface WheelProps {
  onSpinStart: () => void;
  onSpinComplete: (wedge: WheelWedge) => void;
  isSpinning: boolean;
  seed: number; // Used to determine result deterministically from outside or we pick here
  canSpin?: boolean; // Whether spin is allowed (disabled during GUESSING_CONSONANT)
}

export const Wheel: React.FC<WheelProps> = ({ onSpinStart, onSpinComplete, isSpinning, canSpin = true }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Calculate wedge angle size
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  const spin = () => {
    if (isSpinning || !canSpin) return;
    
    // Pick the wedge deterministically before animation
    const randomIndex = Math.floor(Math.random() * WHEEL_CONFIG.length);
    const targetWedge = WHEEL_CONFIG[randomIndex];
    
    onSpinStart();

    // Calculate rotation to land on the pre-selected wedge
    // Wedge i in the SVG is drawn at center angle: -90 + i * wedgeAngle + wedgeAngle/2
    // CSS rotate() goes clockwise, but SVG angles go counterclockwise
    // So we need to negate the angle when converting from SVG to CSS
    // Currently the wheel is rotated by 'rotation' degrees (CSS clockwise)
    // Wedge i appears at: -rotation + wedgeCenterAngle (in SVG angle space)
    // We want it at 0° (the pointer position in SVG space)
    // So we need: -rotation + wedgeCenterAngle = 0 (mod 360)
    // Therefore: rotation = wedgeCenterAngle (mod 360)
    // To get there from current state: spinAmount = wedgeCenterAngle - rotation (mod 360)
    // Add extra spins: spinAmount = extraSpins*360 + wedgeCenterAngle - rotation
    
    const wedgeCenterAngle = -90 + randomIndex * wedgeAngle + wedgeAngle / 2;
    const extraSpins = 5;
    const spinAmount = 360 * extraSpins + wedgeCenterAngle - rotation;
    const newTotalRotation = rotation + spinAmount;
    
    setRotation(newTotalRotation);

    // Report the pre-selected wedge after animation completes
    setTimeout(() => {
      onSpinComplete(targetWedge);
    }, 4000); // Match CSS duration
  };

  return (
    <div className="relative mx-auto my-2 w-full max-w-xs sm:max-w-sm aspect-square">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md" />

      {/* Wheel Container */}
      <div 
        ref={wheelRef}
        className="w-full h-full rounded-full border-8 border-yellow-600 shadow-2xl overflow-hidden relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={spin}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Wedges */}
          <g>
            {WHEEL_CONFIG.map((wedge, i) => {
              const angleOffset = -90; 
              const startAngle = (i * wedgeAngle + angleOffset) * (Math.PI / 180);
              const endAngle = ((i + 1) * wedgeAngle + angleOffset) * (Math.PI / 180);
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
          </g>
          
          <circle cx="50" cy="50" r="50" fill="transparent" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#888" stroke="#555" strokeWidth="1" />

          {/* Text paths for labels - OPTIMAL VISUAL CONFIGURATION */}
          {/* This configuration provides the best visual balance:
              - Radius 44→16: Text positioned in the middle-to-outer area of wedges
              - 3° counterclockwise offset: Centers text within wedge boundaries
              - lengthAdjust="spacingAndGlyphs": Allows text to stretch/compress to fit the path
              - Font sizes (5.5 for CASH, 4.2 for text): Matches visual importance
              All text is vertically centered and nicely distributed within each wedge. */}
          <defs>
            {WHEEL_CONFIG.map((wedge, i) => {
              const midAngleDeg = i * wedgeAngle + wedgeAngle / 2 - 90 - 3; // Shift counterclockwise by 3 degrees
              const midAngleRad = midAngleDeg * (Math.PI / 180);
              // Path from radius 44 to radius 16 (optimal outward positioning)
              const x1 = 50 + 44 * Math.cos(midAngleRad);
              const y1 = 50 + 44 * Math.sin(midAngleRad);
              const x2 = 50 + 16 * Math.cos(midAngleRad);
              const y2 = 50 + 16 * Math.sin(midAngleRad);
              
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

          {/* Labels along paths */}
          <g>
            {WHEEL_CONFIG.map((wedge) => {
              const fillColor = wedge.type === 'BANKRUPT' ? '#fff' : '#000';
              
              return (
                <text
                  key={`label-${wedge.id}`}
                  fontSize={wedge.type === 'CASH' ? '5.5' : '4.2'}
                  fontWeight="bold"
                  fill={fillColor}
                  style={{ pointerEvents: 'none' }}
                  lengthAdjust="spacingAndGlyphs"
                >
                  <textPath href={`#path-${wedge.id}`} startOffset="50%" textAnchor="middle" lengthAdjust="spacingAndGlyphs">
                    {wedge.label}
                  </textPath>
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      
      {/* Center Cap */}
      <button 
        onClick={spin}
        disabled={isSpinning || !canSpin}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-game-accent border-2 border-white flex items-center justify-center z-10 hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-[10px] font-bold text-white">SPIN</span>
      </button>
    </div>
  );
};
