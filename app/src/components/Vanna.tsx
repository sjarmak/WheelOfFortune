import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VannaProps {
  revealedPositions: number[];
  tileRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  puzzleId?: string;
}

const VannaHand: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => (
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
          const rotation = (i - 1.5) * 20;
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
);

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

  const startX = typeof window !== 'undefined' ? window.innerWidth - 60 : 0;
  const startY = typeof window !== 'undefined' ? window.innerHeight - 100 : 0;

  return (
    <>
      {/* Vanna waiting in corner or animating to tile */}
      <AnimatePresence>
        {!isAnimating && (
          <motion.div
            key="vanna-waiting"
            className="fixed w-16 h-16 pointer-events-none z-40 flex items-center justify-center"
            style={{
              bottom: '10px',
              right: '10px'
            }}
          >
            <VannaHand isAnimating={false} />
          </motion.div>
        )}

        {isAnimating && targetPosition && (
          <motion.div
            key={`vanna-animating-${currentTile}`}
            initial={{
              left: startX,
              top: startY,
              scale: 0.8,
              opacity: 1
            }}
            animate={{
              left: targetPosition.x,
              top: targetPosition.y,
              scale: 1,
              opacity: 1
            }}
            exit={{
              left: startX,
              top: startY,
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
            <VannaHand isAnimating={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
