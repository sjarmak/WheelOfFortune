import React, { useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vanna } from './Vanna';

interface BoardProps {
  phrase: string;
  revealedPositions: number[];
  category: string;
  puzzleId?: string;
  isPuzzleSolved?: boolean;
}

export const Board: React.FC<BoardProps> = ({ phrase, revealedPositions, category, puzzleId, isPuzzleSolved = false }) => {
  const MAX_COLS_PER_ROW = 12;
  const boardRows = useMemo(() => {
    type Tile = { char: string; index: number };

    const rows: Tile[][] = [];
    let currentRow: Tile[] = [];
    let currentCount = 0;
    let wordBuffer: Tile[] = [];

    const trimTrailingSpaces = () => {
      while (currentRow.length > 0 && currentRow[currentRow.length - 1].char === ' ') {
        currentRow.pop();
        currentCount--;
      }
    };

    const pushWordBuffer = () => {
      if (wordBuffer.length === 0) return;

      if (currentCount > 0 && currentCount + wordBuffer.length > MAX_COLS_PER_ROW) {
        trimTrailingSpaces();
        rows.push(currentRow);
        currentRow = [];
        currentCount = 0;
      }

      while (wordBuffer.length > 0) {
        const available = MAX_COLS_PER_ROW - currentCount;
        const take = available <= 0 ? wordBuffer.length : Math.min(wordBuffer.length, available);
        const chunk = wordBuffer.splice(0, take);
        currentRow.push(...chunk);
        currentCount += chunk.length;

        if (currentCount >= MAX_COLS_PER_ROW) {
          trimTrailingSpaces();
          rows.push(currentRow);
          currentRow = [];
          currentCount = 0;
        }
      }
    };

    for (let index = 0; index < phrase.length; index++) {
      const char = phrase[index];
      if (char === ' ') {
        pushWordBuffer();
        if (currentCount === 0) {
          continue;
        }
        if (currentCount + 1 > MAX_COLS_PER_ROW) {
          trimTrailingSpaces();
          rows.push(currentRow);
          currentRow = [];
          currentCount = 0;
        }
        currentRow.push({ char: ' ', index });
        currentCount += 1;
      } else {
        wordBuffer.push({ char, index });
      }
    }

    pushWordBuffer();
    if (currentRow.length > 0) {
      trimTrailingSpaces();
      rows.push(currentRow);
    }

    if (rows.length === 0) {
      rows.push([]);
    }

    return rows;
  }, [phrase]);
  const tileRefsArray = useRef<(HTMLDivElement | null)[]>([]);
  const [visiblePositions, setVisiblePositions] = useState<number[]>([]);

  // When Vanna visits a tile, make it visible
  const handleTileVisited = useCallback((position: number) => {
    setVisiblePositions(prev => 
      prev.includes(position) ? prev : [...prev, position]
    );
  }, []);

  // Reset visible positions when puzzle changes
  React.useEffect(() => {
    setVisiblePositions([]);
  }, [puzzleId, phrase]);

  const renderLetter = (char: string, globalIndex: number) => {
    // Letter is visible only after Vanna has visited it
    const isRevealed = visiblePositions.includes(globalIndex);
    const isLetter = /[A-Z]/.test(char);
    const isPunctuation = /[^A-Z ]/.test(char);

    if (char === ' ') return <div key={globalIndex} className="w-6 h-8 sm:w-10 sm:h-14" />;

    return (
      <div 
        key={globalIndex}
        ref={el => { tileRefsArray.current[globalIndex] = el; }}
        className="w-6 h-8 sm:w-10 sm:h-14 border border-gray-300 m-0.5 flex items-center justify-center text-base sm:text-2xl font-bold shadow-md bg-white overflow-hidden"
      >
        {isPunctuation ? (
          <span className="text-black">{char}</span>
        ) : isLetter ? (
          <AnimatePresence mode="wait">
            {isRevealed && (
              <motion.div
                key={`revealed-${globalIndex}`}
                initial={{ backgroundColor: '#2563eb' }}
                animate={{ backgroundColor: '#ffffff' }}
                transition={{ duration: 0.4 }}
                className="w-full h-full flex items-center justify-center"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="text-black font-bold"
                >
                  {char}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        ) : null}
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={puzzleId || phrase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center p-1 sm:p-2 bg-game-board rounded-lg sm:rounded-xl border-2 sm:border-4 border-yellow-500 shadow-2xl w-full max-w-5xl mx-auto relative overflow-hidden"
        >
        {/* Vanna positioned in lower right of board */}
        <div className="absolute bottom-2 right-2 z-40 w-16 h-16 pointer-events-none">
          <Vanna 
            revealedPositions={revealedPositions} 
            tileRefs={tileRefsArray} 
            isPuzzleSolved={isPuzzleSolved}
            onTileVisited={handleTileVisited}
          />
        </div>
        <div className="flex flex-col gap-1 sm:gap-2 w-full">
          {boardRows.map((row, rowIdx) => (
            <div key={`${puzzleId}-row-${rowIdx}`} className="flex justify-center gap-1 sm:gap-2 flex-wrap">
              {row.map(tile => renderLetter(tile.char, tile.index))}
            </div>
          ))}
        </div>
         <div className="mt-1 sm:mt-2 bg-blue-900 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white sm:border-2 text-white font-bold text-xs sm:text-sm tracking-widest uppercase">
          {category.replace(/_/g, ' ')}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
