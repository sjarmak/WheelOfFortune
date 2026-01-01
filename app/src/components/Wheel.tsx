import React, { useRef, useState } from 'react';
import { WHEEL_CONFIG, WheelWedge } from '../engine/types';

interface WheelProps {
  onSpinStart: () => void;
  onSpinComplete: (wedge: WheelWedge) => void;
  isSpinning: boolean;
  seed: number; // Used to determine result deterministically from outside or we pick here
}

export const Wheel: React.FC<WheelProps> = ({ onSpinStart, onSpinComplete, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Calculate wedge angle size
  const wedgeAngle = 360 / WHEEL_CONFIG.length;

  const spin = () => {
    if (isSpinning) return;
    
    onSpinStart();

    const randomIndex = Math.floor(Math.random() * WHEEL_CONFIG.length);
    const targetWedge = WHEEL_CONFIG[randomIndex];
    
    const extraSpins = 5;
    const baseRotation = 360 * extraSpins;
    
    // Calculate the angle to the middle of the target wedge
    // Wedges are drawn starting at -90° (top)
    // Middle of wedge i is at: -90 + (i * wedgeAngle) + (wedgeAngle / 2)
    // To land at pointer (0°), we need to rotate wheel so this angle reaches 0°
    const middleAngle = -90 + (randomIndex * wedgeAngle) + (wedgeAngle / 2);
    const targetRotation = -middleAngle;
    
    // Add to current rotation to make spins additive (prevents backwards spin on subsequent spins)
    const spinAmount = baseRotation + targetRotation;
    const newTotalRotation = rotation + spinAmount;
    
    setRotation(newTotalRotation);

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
        disabled={isSpinning}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-game-accent border-2 border-white flex items-center justify-center z-10 hover:scale-110 active:scale-95 transition-transform"
      >
        <span className="text-[10px] font-bold text-white">SPIN</span>
      </button>
    </div>
  );
};
