import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VannaProps {
  revealedPositions: number[];
  tileRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  puzzleId?: string;
}

const VannaHand: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => (
  <div className="relative w-full h-full" style={{ imageRendering: 'pixelated' }}>
    {/* Sparkle burst - only when animating */}
    {isAnimating && (
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
        style={{ filter: 'blur(8px)' }}
      />
    )}

    {/* 8-bit Pixelated Woman Character */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-14 h-16" style={{ imageRendering: 'pixelated' }}>
        {/* Hair - blonde, wavy top */}
        <div className="absolute top-0 left-0 w-full h-3">
          <div className="flex gap-0.5 h-full">
            <div className="w-1 h-full bg-yellow-400" />
            <div className="w-1 h-full bg-yellow-400" />
            <div className="w-1 h-full bg-yellow-400" />
            <div className="w-1 h-full bg-yellow-400" />
            <div className="w-1 h-full bg-yellow-400" />
          </div>
        </div>

        {/* Face */}
        <div className="absolute top-3 left-1 w-12 h-3">
          <div className="w-full h-full bg-yellow-200 flex items-center justify-center gap-1 px-1">
            {/* Left eye */}
            <div className="w-1 h-1 bg-blue-600" />
            {/* Right eye */}
            <div className="w-1 h-1 bg-blue-600" />
          </div>
        </div>

        {/* Dress - red with pattern */}
        <div className="absolute top-6 left-0 w-full h-10">
          {/* Dress body */}
          <div className="w-full h-full bg-red-600">
            {/* Dress pattern - white stripes */}
            <div className="flex flex-col gap-1 p-1 h-full justify-between">
              <div className="w-full h-1 bg-white opacity-40" />
              <div className="w-full h-1 bg-white opacity-40" />
              <div className="w-full h-1 bg-white opacity-40" />
            </div>
          </div>

          {/* Arms - flesh colored */}
          <div className="absolute top-0 -left-2 w-2 h-4 bg-yellow-200" />
          <div className="absolute top-0 -right-2 w-2 h-4 bg-yellow-200" />
        </div>

        {/* Legs */}
        <div className="absolute bottom-0 left-2 w-1.5 h-3 bg-yellow-200" />
        <div className="absolute bottom-0 right-2 w-1.5 h-3 bg-yellow-200" />

        {/* Shoes - black */}
        <div className="absolute bottom-0 left-1 w-2 h-1 bg-gray-800" />
        <div className="absolute bottom-0 right-1 w-2 h-1 bg-gray-800" />

        {/* Sparkles - only when animating */}
        {isAnimating && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const x = Math.cos(angle) * 20;
              const y = Math.sin(angle) * 20;
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
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full shadow-md"
                  style={{
                    backgroundColor: '#FFD700',
                    marginLeft: '-3px',
                    marginTop: '-3px',
                    boxShadow: '0 0 4px #FFD700'
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

  return (
    <>
      {/* Vanna waiting in corner or animating to tile */}
      <AnimatePresence>
        {!isAnimating && (
          <motion.div
            key="vanna-waiting"
            className="w-full h-full flex items-center justify-center"
          >
            <VannaHand isAnimating={false} />
          </motion.div>
        )}

        {isAnimating && targetPosition && (
          <motion.div
            key={`vanna-animating-${currentTile}`}
            initial={{
              x: window.innerWidth - 60,
              y: window.innerHeight - 100,
              scale: 0.8,
              opacity: 1
            }}
            animate={{
              x: targetPosition.x - window.innerWidth / 2,
              y: targetPosition.y - window.innerHeight / 2,
              scale: 1,
              opacity: 1
            }}
            exit={{
              x: window.innerWidth - 60,
              y: window.innerHeight - 100,
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
