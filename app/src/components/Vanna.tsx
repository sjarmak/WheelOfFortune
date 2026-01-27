import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getShopItem } from '../engine/shopTypes';

interface VannaProps {
  revealedPositions: number[];
  tileRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  puzzleId?: string;
  isPuzzleSolved?: boolean;
  onTileVisited?: (position: number) => void;
  dressColorId?: string | null; // Equipped dress item ID
  hairColorId?: string | null;  // Equipped hair item ID
}

interface WalkFrame {
  leftLegOffset: number;
  rightLegOffset: number;
  leftArmOffset: number;
  rightArmOffset: number;
}

const WALK_FRAMES: WalkFrame[] = [
  // Frame 1: Left leg forward, right arm forward
  { leftLegOffset: -2, rightLegOffset: 1, leftArmOffset: -2, rightArmOffset: 1 },
  // Frame 2: Both legs neutral
  { leftLegOffset: 0, rightLegOffset: 0, leftArmOffset: 0, rightArmOffset: 0 },
  // Frame 3: Right leg forward, left arm forward
  { leftLegOffset: 1, rightLegOffset: -2, leftArmOffset: 1, rightArmOffset: -2 },
  // Frame 4: Both legs neutral
  { leftLegOffset: 0, rightLegOffset: 0, leftArmOffset: 0, rightArmOffset: 0 },
];

type FacingDirection = 'front' | 'left' | 'right';

interface VannaHandProps {
  isAnimating: boolean;
  facing?: FacingDirection;
  isDancing?: boolean;
  hairColor?: string; // Hex color like '#FACC15'
  dressColor?: string; // Hex color like '#DC2626'
}

// Default colors (original Vanna appearance)
const DEFAULT_HAIR_COLOR = '#FACC15'; // yellow-400
const DEFAULT_DRESS_COLOR = '#DC2626'; // red-600

// Celebration constants
const CONFETTI_COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#D946EF', '#06B6D4'];
const FIREWORK_COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#D946EF'];
const CONFETTI_COUNT = 20;
const FIREWORK_COUNT = 5;

const getConfettiConfig = (index: number) => {
  const r1 = (index * 13 + 7) % 100 / 100;
  const r2 = (index * 29 + 3) % 100 / 100;
  const r3 = (index * 47 + 11) % 100 / 100;
  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    startX: (r1 * 60) - 30, // -30 to 30 spread
    startY: -30 - (r2 * 20), // -30 to -50
    endY: 20 + (r2 * 60), // 20 to 80
    drift: (r3 * 20) - 10, // -10 to +10
    rotation: r1 * 360,
    delay: r3 * 0.2 // 0 to 0.2s delay
  };
};

const getFireworkConfig = (index: number) => {
  const r1 = (index * 17 + 5) % 100 / 100;
  const r2 = (index * 31 + 13) % 100 / 100;
  const angle = (index / FIREWORK_COUNT) * Math.PI * 2 + (r1 * 1);
  const radius = 25 + (r2 * 10);
  return {
    color: FIREWORK_COLORS[index % FIREWORK_COLORS.length],
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    delay: index * 0.15, // Staggered
    scale: 0.5 + (r1 * 0.5)
  };
};

const VannaHand: React.FC<VannaHandProps> = ({
  isAnimating,
  facing = 'front',
  isDancing = false,
  hairColor = DEFAULT_HAIR_COLOR,
  dressColor = DEFAULT_DRESS_COLOR
}) => {
  const [walkFrame, setWalkFrame] = React.useState(0);

  // Cycle through walk frames while animating or dancing
  React.useEffect(() => {
    if (!isAnimating && !isDancing) {
      setWalkFrame(0);
      return;
    }

    const frameTime = isDancing ? 120 : 200; // Dance is faster
    const interval = setInterval(() => {
      setWalkFrame(prev => (prev + 1) % WALK_FRAMES.length);
    }, frameTime);

    return () => clearInterval(interval);
  }, [isAnimating, isDancing]);

  const frame = WALK_FRAMES[walkFrame];
  const isSideView = facing === 'left' || facing === 'right';
  const flipHorizontal = facing === 'left';

  // Dance bounce effect
  const danceTransform = isDancing ? `translateY(${Math.sin(walkFrame * Math.PI / 2) * 4}px)` : '';

  return (
    <div 
      className="relative w-full h-full" 
      style={{ 
        imageRendering: 'pixelated',
        transform: `${danceTransform} ${flipHorizontal ? 'scaleX(-1)' : ''}`,
        transition: 'transform 0.15s ease-out'
      }}
    >

      {/* 8-bit Pixelated Woman Character */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isSideView ? (
          /* SIDE VIEW SPRITE */
          <div className="relative w-10 h-16" style={{ imageRendering: 'pixelated' }}>
            {/* Hair - side view (ponytail effect) */}
            <div className="absolute top-0 left-1 w-6 h-3" style={{ backgroundColor: hairColor }} />
            <div className="absolute top-1 right-0 w-2 h-4" style={{ backgroundColor: hairColor }} /> {/* Hair flowing back */}

            {/* Face - side profile */}
            <div className="absolute top-3 left-1 w-5 h-3 bg-yellow-200">
              {/* One eye visible */}
              <div className="absolute top-1 left-3 w-1 h-1 bg-blue-600" />
              {/* Nose hint */}
              <div className="absolute top-1 left-0 w-1 h-1 bg-yellow-300" />
            </div>

            {/* Dress - side view (narrower) */}
            <div className="absolute top-6 left-1 w-6 h-10">
              <div className="w-full h-full" style={{ backgroundColor: dressColor }}>
                {/* Dress pattern */}
                <div className="flex flex-col gap-1 p-0.5 h-full justify-between">
                  <div className="w-full h-0.5 bg-white opacity-40" />
                  <div className="w-full h-0.5 bg-white opacity-40" />
                  <div className="w-full h-0.5 bg-white opacity-40" />
                </div>
              </div>

              {/* One arm visible (front arm), swinging */}
              <motion.div
                animate={{ x: frame.leftArmOffset }}
                transition={{ duration: 0.05 }}
                className="absolute top-0 left-5 w-2 h-4 bg-yellow-200"
              />
            </div>

            {/* Legs - side view, walking motion */}
            <motion.div
              animate={{ x: frame.leftLegOffset }}
              transition={{ duration: 0.05 }}
              className="absolute bottom-0 left-2 w-1.5 h-3 bg-yellow-200"
            />
            <motion.div
              animate={{ x: frame.rightLegOffset }}
              transition={{ duration: 0.05 }}
              className="absolute bottom-0 left-4 w-1.5 h-3 bg-yellow-200"
            />

            {/* One shoe visible */}
            <div className="absolute bottom-0 left-1.5 w-2 h-1 bg-gray-800" />
            <div className="absolute bottom-0 left-3.5 w-2 h-1 bg-gray-800" />
          </div>
        ) : (
          /* FRONT VIEW SPRITE (original) */
          <div className="relative w-14 h-16" style={{ imageRendering: 'pixelated' }}>
            {/* Hair - wavy top */}
            <div className="absolute top-0 left-0 w-full h-3">
              <div className="flex gap-0.5 h-full">
                <div className="w-1 h-full" style={{ backgroundColor: hairColor }} />
                <div className="w-1 h-full" style={{ backgroundColor: hairColor }} />
                <div className="w-1 h-full" style={{ backgroundColor: hairColor }} />
                <div className="w-1 h-full" style={{ backgroundColor: hairColor }} />
                <div className="w-1 h-full" style={{ backgroundColor: hairColor }} />
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

            {/* Dress - with pattern */}
            <div className="absolute top-6 left-0 w-full h-10">
              {/* Dress body */}
              <div className="w-full h-full" style={{ backgroundColor: dressColor }}>
                {/* Dress pattern - white stripes */}
                <div className="flex flex-col gap-1 p-1 h-full justify-between">
                  <div className="w-full h-1 bg-white opacity-40" />
                  <div className="w-full h-1 bg-white opacity-40" />
                  <div className="w-full h-1 bg-white opacity-40" />
                </div>
              </div>

              {/* Arms - flesh colored, animate with walk */}
              <motion.div
                animate={{ y: isDancing ? frame.leftArmOffset * 2 : frame.leftArmOffset }}
                transition={{ duration: 0.05 }}
                className="absolute top-0 -left-2 w-2 h-4 bg-yellow-200"
              />
              <motion.div
                animate={{ y: isDancing ? frame.rightArmOffset * 2 : frame.rightArmOffset }}
                transition={{ duration: 0.05 }}
                className="absolute top-0 -right-2 w-2 h-4 bg-yellow-200"
              />
            </div>

            {/* Legs - animate with walk */}
            <motion.div
              animate={{ y: isDancing ? frame.leftLegOffset * 1.5 : frame.leftLegOffset }}
              transition={{ duration: 0.05 }}
              className="absolute bottom-0 left-2 w-1.5 h-3 bg-yellow-200"
            />
            <motion.div
              animate={{ y: isDancing ? frame.rightLegOffset * 1.5 : frame.rightLegOffset }}
              transition={{ duration: 0.05 }}
              className="absolute bottom-0 right-2 w-1.5 h-3 bg-yellow-200"
            />

            {/* Shoes - black */}
            <div className="absolute bottom-0 left-1 w-2 h-1 bg-gray-800" />
            <div className="absolute bottom-0 right-1 w-2 h-1 bg-gray-800" />
          </div>
        )}

        {/* Celebration Effects - Confetti & Fireworks */}
        {isAnimating && (
          <>
            {/* Confetti */}
            {[...Array(CONFETTI_COUNT)].map((_, i) => {
              const config = getConfettiConfig(i);
              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ x: config.startX, y: config.startY, opacity: 1, rotate: 0 }}
                  animate={{ x: config.startX + config.drift, y: config.endY, opacity: 0, rotate: config.rotation }}
                  transition={{ duration: 0.8, ease: "linear", delay: config.delay }}
                  className="absolute top-0 left-1/2 w-1 h-1.5"
                  style={{ backgroundColor: config.color }}
                />
              );
            })}

            {/* Fireworks */}
            {[...Array(FIREWORK_COUNT)].map((_, i) => {
              const config = getFireworkConfig(i);
              return (
                <motion.div
                  key={`firework-${i}`}
                  initial={{ x: config.x * 0.2, y: config.y * 0.2, opacity: 1, scale: 0 }}
                  animate={{ x: config.x, y: config.y, opacity: 0, scale: config.scale }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: config.delay }}
                  className="absolute top-1/2 left-1/2"
                >
                  <div className="w-2 h-2 rotate-45" style={{ backgroundColor: config.color }} />
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export const Vanna: React.FC<VannaProps> = ({
  revealedPositions,
  tileRefs,
  isPuzzleSolved = false,
  onTileVisited,
  dressColorId,
  hairColorId
}) => {
  // Get hex colors from equipped items
  const dressItem = dressColorId ? getShopItem(dressColorId) : null;
  const hairItem = hairColorId ? getShopItem(hairColorId) : null;
  const dressColor = dressItem?.hexColor || DEFAULT_DRESS_COLOR;
  const hairColor = hairItem?.hexColor || DEFAULT_HAIR_COLOR;

  const [currentTile, setCurrentTile] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [facingDirection, setFacingDirection] = useState<FacingDirection>('front');
  const previousRevealedRef = useRef<number[]>([]);
  const animationQueueRef = useRef<number[]>([]);
  const isAnimatingRef = useRef(false);
  const cornerRef = useRef<HTMLDivElement>(null);

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

  const getCornerPosition = () => {
    if (!cornerRef.current) return null;
    const rect = cornerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const processQueue = async () => {
    isAnimatingRef.current = true;
    setIsAnimating(true);

    while (animationQueueRef.current.length > 0) {
      // Before each tile, sort remaining queue by distance from corner to pick closest next
      const cornerPos = getCornerPosition();
      if (cornerPos && animationQueueRef.current.length > 1) {
        animationQueueRef.current.sort((tileA, tileB) => {
          const posA = getTilePosition(tileA);
          const posB = getTilePosition(tileB);
          if (!posA || !posB) return 0;

          const distA = Math.hypot(posA.x - cornerPos.x, posA.y - cornerPos.y);
          const distB = Math.hypot(posB.x - cornerPos.x, posB.y - cornerPos.y);
          return distA - distB;
        });
      }

      const nextTile = animationQueueRef.current.shift();
      if (nextTile === undefined) break;

      const tilePos = getTilePosition(nextTile);
      
      if (cornerPos && tilePos) {
        // Determine facing direction based on tile position relative to corner
        const goingDirection: FacingDirection = tilePos.x < cornerPos.x ? 'left' : 'right';
        const returnDirection: FacingDirection = goingDirection === 'left' ? 'right' : 'left';

        // Phase 1: Walk TO the tile
        setCurrentTile(nextTile);
        setStartPosition(cornerPos);
        setTargetPosition(tilePos);
        setIsReturning(false);
        setFacingDirection(goingDirection);

        // Wait for walk to tile (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Vanna has arrived - trigger the reveal!
        onTileVisited?.(nextTile);

        // Phase 2: Walk BACK to corner
        setIsReturning(true);
        setFacingDirection(returnDirection);

        // Wait for walk back to corner (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
    setIsReturning(false);
    setCurrentTile(null);
    setTargetPosition(null);
    setStartPosition(null);
  };

  return (
    <>
      {/* Vanna waiting in corner - this div is also used to calculate animation start position */}
      <div 
        ref={cornerRef}
        className="w-full h-full flex items-center justify-center"
      >
        {!isAnimating && <VannaHand isAnimating={false} isDancing={isPuzzleSolved} hairColor={hairColor} dressColor={dressColor} />}
      </div>

      {/* Vanna animating to tile and back - walks along the bottom, stays grounded */}
      {isAnimating && targetPosition && startPosition && (
        <motion.div
          key={`vanna-animating-${currentTile}-${isReturning ? 'return' : 'go'}`}
          initial={{
            x: (isReturning ? targetPosition.x : startPosition.x) - 32,
            y: startPosition.y - 32, // Stay at floor level
            scale: 1,
            opacity: 1
          }}
          animate={{
            x: (isReturning ? startPosition.x : targetPosition.x) - 32,
            y: startPosition.y - 32, // Stay at floor level
            scale: 1,
            opacity: 1
          }}
          transition={{
            duration: 1.0,
            type: "spring",
            stiffness: 120,
            damping: 20
          }}
          className="fixed top-0 left-0 w-16 h-16 pointer-events-none z-50 flex items-center justify-center"
        >
          <VannaHand isAnimating={true} facing={facingDirection} hairColor={hairColor} dressColor={dressColor} />
        </motion.div>
      )}
    </>
  );
};
