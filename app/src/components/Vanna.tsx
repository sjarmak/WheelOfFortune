import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VannaProps {
  revealedPositions: number[];
  tileRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  puzzleId?: string;
}

export const Vanna: React.FC<VannaProps> = ({ revealedPositions, tileRefs }) => {
  const [currentTile, setCurrentTile] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
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
    setIsAnimating(true);

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
    setIsAnimating(false);
    setCurrentTile(null);
    setTargetPosition(null);
  };

  const startX = window.innerWidth - 50;
  const startY = window.innerHeight - 90;

  return (
    <>
      {/* Vanna waiting in corner or animating to tile */}
      <AnimatePresence>
        <motion.div
          key={isAnimating && currentTile !== null ? `vanna-animating-${currentTile}` : 'vanna-waiting'}
          initial={isAnimating && targetPosition ? {
            x: startX,
            y: startY,
            scale: 0.8,
            opacity: 1
          } : {
            x: startX,
            y: startY,
            scale: 1,
            opacity: 1
          }}
          animate={isAnimating && targetPosition ? {
            x: targetPosition.x,
            y: targetPosition.y,
            scale: 1,
            opacity: 1
          } : {
            x: startX,
            y: startY,
            scale: 1,
            opacity: 1
          }}
          exit={isAnimating ? {
            x: startX,
            y: startY,
            scale: 0.8,
            opacity: 0,
            transition: { duration: 0.3 }
          } : {}}
          transition={isAnimating && targetPosition ? {
            duration: 0.6,
            type: "spring",
            stiffness: 300,
            damping: 25
          } : {
            duration: 0
          }}
          className="fixed w-14 h-14 pointer-events-none z-40 flex items-center justify-center"
          style={{
            left: isAnimating && targetPosition ? `${targetPosition.x}px` : `${startX}px`,
            top: isAnimating && targetPosition ? `${targetPosition.y}px` : `${startY}px`,
            marginLeft: '-28px',
            marginTop: '-28px'
          }}
        >
          {/* Simple Vanna sprite - stylized hand/character */}
          <div className="relative w-full h-full">
            {/* Sparkle burst around hand - only when animating */}
            {isAnimating && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
                style={{ filter: 'blur(8px)' }}
              />
            )}

            {/* Main sprite - hand shape */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-10 h-10">
                {/* Wrist */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-pink-200 rounded-t-lg" />
                
                {/* Palm */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-4 bg-pink-300 rounded-full shadow-lg" />
                
                {/* Fingers - spread out */}
                {[...Array(4)].map((_, i) => {
                  const rotation = (i - 1.5) * 20; // Spread fingers
                  return (
                    <motion.div
                      key={i}
                      initial={{ rotate: 0 }}
                      animate={{ rotate: isAnimating ? rotation : 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="absolute top-0 left-1/2 w-1 h-3 bg-pink-400 rounded-full origin-bottom"
                      style={{
                        transformOrigin: 'center bottom',
                        marginLeft: '-2px'
                      }}
                    />
                  );
                })}

                {/* Sparkles around hand - only when animating */}
                {isAnimating && (
                  <>
                    {[...Array(6)].map((_, i) => {
                      const angle = (i / 6) * Math.PI * 2;
                      const x = Math.cos(angle) * 18;
                      const y = Math.sin(angle) * 18;
                      return (
                        <motion.div
                          key={`sparkle-${i}`}
                          initial={{ 
                            x: 0, 
                            y: 0,
                            opacity: 1,
                            scale: 1
                          }}
                          animate={{ 
                            x,
                            y,
                            opacity: 0,
                            scale: 0
                          }}
                          transition={{ 
                            duration: 0.6,
                            ease: "easeOut",
                            delay: i * 0.05
                          }}
                          className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-300 rounded-full shadow-md"
                          style={{
                            marginLeft: '-2px',
                            marginTop: '-2px'
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
