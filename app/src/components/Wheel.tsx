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

    const randomIndex = Math.floor(Math.random() * WHEEL_CONFIG.length);
    const targetWedge = WHEEL_CONFIG[randomIndex];
    
    const extraSpins = 5;
    const baseRotation = 360 * extraSpins;
    
    // Correctly calculate the angle to the middle of the target wedge
    const targetAngle = (randomIndex * wedgeAngle) + (wedgeAngle / 2);
    const targetRotation = -targetAngle;
    
    const jitter = (Math.random() - 0.5) * (wedgeAngle * 0.8);
    
    // Use a non-additive rotation to prevent compounding errors
    const newTotalRotation = baseRotation + targetRotation + jitter;
    
    setRotation(newTotalRotation);

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
        className="w-full h-full rounded-full border-8 border-yellow-600 shadow-2xl overflow-hidden relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={spin}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g>
            {WHEEL_CONFIG.map((wedge, i) => {
              // This offset aligns the drawing with the label and spin logic (0 deg = top)
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

          <g>
            {WHEEL_CONFIG.map((wedge, i) => {
              const midAngleDeg = (i + 0.5) * wedgeAngle; // 0 at top, clockwise from 12 o'clock
              const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180); // for Math.cos/sin: 0 at right, counter-clockwise initially. -90 shifts 0 to top.
              const words = wedge.label.split(' ');
              const fillColor = wedge.type === 'BANKRUPT' ? '#fff' : '#000';

              let textRotation = midAngleDeg; // Base rotation to align text baseline radially
              const isBottomHalf = midAngleDeg > 90 && midAngleDeg < 270;

              // If in the bottom half, flip text 180 degrees to keep it readable
              if (isBottomHalf) {
                textRotation += 180;
              }

              if (words.length > 1) {
                // Adjust radii for better spacing and ensure reading order
                const r1 = 22; // Radius for first word (closer to center)
                const r2 = 34; // Radius for second word (further from center)

                // Swap words and radii if in the bottom half for correct reading order
                const displayWords = isBottomHalf ? [words[1], words[0]] : [words[0], words[1]];
                const displayR1 = isBottomHalf ? r2 : r1;
                const displayR2 = isBottomHalf ? r1 : r2;

                const x1 = 50 + displayR1 * Math.cos(midAngleRad);
                const y1 = 50 + displayR1 * Math.sin(midAngleRad);
                const x2 = 50 + displayR2 * Math.cos(midAngleRad);
                const y2 = 50 + displayR2 * Math.sin(midAngleRad);
                
                return (
                  <g key={`label-${wedge.id}`}>
                    <text x={x1} y={y1} transform={`rotate(${textRotation}, ${x1}, ${y1})`} textAnchor="middle" alignmentBaseline="middle" fontSize="4.5" fontWeight="bold" fill={fillColor} style={{ pointerEvents: 'none' }}>
                      {displayWords[0]}
                    </text>
                     <text x={x2} y={y2} transform={`rotate(${textRotation}, ${x2}, ${y2})`} textAnchor="middle" alignmentBaseline="middle" fontSize="4.5" fontWeight="bold" fill={fillColor} style={{ pointerEvents: 'none' }}>
                      {displayWords[1]}
                    </text>
                  </g>
                )
              }
              
              // Single-word labels
              const r = 28; // Adjusted radius for single words
              const x = 50 + r * Math.cos(midAngleRad);
              const y = 50 + r * Math.sin(midAngleRad);
              
              return (
                 <text 
                  key={`label-${wedge.id}`} 
                  x={x}
                  y={y}
                  transform={`rotate(${textRotation}, ${x}, ${y})`}
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  fontSize={wedge.type === 'CASH' ? '6' : '5'} 
                  fontWeight="bold" 
                  fill={fillColor}
                  style={{ pointerEvents: 'none' }}
                >
                  {wedge.label}
                </text>
              )
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
