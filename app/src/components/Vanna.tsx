import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VannaProps {
  revealedPositions: number[];
  tileRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export const Vanna: React.FC<VannaProps> = ({ revealedPositions, tileRefs }) => {
  const [currentTile, setCurrentTile] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const previousRevealedRef = useRef<number[]>([]);
  const animationQueueRef = useRef<number[]>([]);
  const isAnimatingRef = useRef(false);

  // Detect newly revealed positions
  useEffect(() => {
    const newlyRevealed = revealedPositions.filter(
      pos => !previousRevealedRef.current.includes(pos)
    );

    if (newlyRevealed.length > 0) {
      animationQueueRef.current = [...animationQueueRef.current, ...newlyRevealed];
      previousRevealedRef.current = revealedPositions;

      // Start processing queue if not already animating
      if (!isAnimatingRef.current) {
        processQueue();
      }
    }
  }, [revealedPositions]);

  const getTilePosition = (tileIndex: number) => {
    const tile = tileRefs.current[tileIndex];
    if (!tile) return null;

    const rect = tile.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const processQueue = async () => {
    isAnimatingRef.current = true;

    while (animationQueueRef.current.length > 0) {
      const nextTile = animationQueueRef.current.shift();
      if (nextTile === undefined) break;

      const position = getTilePosition(nextTile);
      if (position) {
        setCurrentTile(nextTile);
        setTargetPosition(position);

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    isAnimatingRef.current = false;
    setCurrentTile(null);
    setTargetPosition(null);
  };

  if (currentTile === null || !targetPosition) return null;

  const startX = window.innerWidth - 80;
  const startY = window.innerHeight - 120;

  return (
    <AnimatePresence>
      <motion.div
        key={`vanna-${currentTile}`}
        initial={{ 
          x: startX,
          y: startY,
          scale: 0.8,
          opacity: 1
        }}
        animate={{ 
          x: targetPosition.x,
          y: targetPosition.y,
          scale: 1,
          opacity: 1
        }}
        exit={{ 
          x: startX,
          y: startY,
          scale: 0.8,
          opacity: 0,
          transition: { duration: 0.3 }
        }}
        transition={{ 
          duration: 0.6,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
        className="fixed w-16 h-16 pointer-events-none z-40 flex items-center justify-center"
        style={{
          marginLeft: '-32px',
          marginTop: '-32px'
        }}
      >
        {/* Simple Vanna sprite - stylized hand/character */}
        <div className="relative w-full h-full">
          {/* Sparkle burst */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
            style={{ filter: 'blur(8px)' }}
          />

          {/* Main sprite - hand shape */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-10 h-10">
              {/* Wrist */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-pink-200 rounded-t-lg" />
              
              {/* Palm */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-5 bg-pink-300 rounded-full shadow-lg" />
              
              {/* Fingers - spread out */}
              {[...Array(4)].map((_, i) => {
                const rotation = (i - 1.5) * 20; // Spread fingers
                return (
                  <motion.div
                    key={i}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: rotation }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="absolute top-0 left-1/2 w-1.5 h-4 bg-pink-400 rounded-full origin-bottom"
                    style={{
                      transformOrigin: 'center bottom',
                      marginLeft: '-3px'
                    }}
                  />
                );
              })}

              {/* Sparkles around hand */}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const distance = 40;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    initial={{ 
                      x: targetPosition.x, 
                      y: targetPosition.y,
                      opacity: 1,
                      scale: 1
                    }}
                    animate={{ 
                      x: targetPosition.x + x,
                      y: targetPosition.y + y,
                      opacity: 0,
                      scale: 0
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: "easeOut",
                      delay: i * 0.05
                    }}
                    className="fixed w-1 h-1 bg-yellow-300 rounded-full shadow-md pointer-events-none z-35"
                    style={{
                      marginLeft: '-2px',
                      marginTop: '-2px'
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
