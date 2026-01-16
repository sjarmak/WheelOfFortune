/**
 * Interactive Board Component
 *
 * Kid-mode wrapper for the Board that adds:
 * - Click letters to hear their phonetic sound
 * - Swipe across letters to hear word parts or whole words
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vanna } from './Vanna';
import { getLetterSound } from '../engine/phonics';
import { speak, cancelSpeech } from '../engine/tts';

interface InteractiveBoardProps {
  phrase: string;
  revealedPositions: number[];
  category: string;
  puzzleId?: string;
  isPuzzleSolved?: boolean;
  readAloudEnabled: boolean;
  dressColorId?: string | null;
  hairColorId?: string | null;
}

interface WordInfo {
  word: string;
  startIndex: number;
}

export const InteractiveBoard: React.FC<InteractiveBoardProps> = ({
  phrase,
  revealedPositions,
  category,
  puzzleId,
  isPuzzleSolved = false,
  readAloudEnabled,
  dressColorId,
  hairColorId
}) => {
  const MAX_COLS_PER_ROW = 12;
  const tileRefsArray = useRef<(HTMLDivElement | null)[]>([]);
  const [visiblePositions, setVisiblePositions] = useState<number[]>([]);

  // Track swipe selection
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const isSwiping = useRef(false);

  // Build word lookup: for each character index, what word is it in?
  const wordLookup = useMemo(() => {
    const lookup: Map<number, WordInfo> = new Map();
    const words = phrase.split(' ');
    let charIndex = 0;

    for (const word of words) {
      const startIndex = charIndex;
      for (let i = 0; i < word.length; i++) {
        lookup.set(charIndex, { word, startIndex });
        charIndex++;
      }
      charIndex++; // space
    }

    return lookup;
  }, [phrase]);

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

  // Handle letter click - speak the phonetic sound
  const handleLetterClick = useCallback((char: string, globalIndex: number) => {
    if (!readAloudEnabled) return;
    if (!visiblePositions.includes(globalIndex)) return;

    const wordInfo = wordLookup.get(globalIndex);
    if (!wordInfo) return;

    const posInWord = globalIndex - wordInfo.startIndex;
    const sound = getLetterSound(char, wordInfo.word, posInWord);

    if (sound === 'silent') {
      speak(`Silent ${char}`, { rate: 0.85 });
    } else {
      speak(sound, { rate: 0.85 });
    }
  }, [readAloudEnabled, visiblePositions, wordLookup]);

  // Handle swipe start
  const handleSwipeStart = useCallback((globalIndex: number) => {
    if (!readAloudEnabled) return;
    if (!visiblePositions.includes(globalIndex)) return;

    isSwiping.current = true;
    setSelectedIndices([globalIndex]);
    cancelSpeech();
  }, [readAloudEnabled, visiblePositions]);

  // Handle swipe move
  const handleSwipeMove = useCallback((globalIndex: number) => {
    if (!isSwiping.current) return;
    if (!visiblePositions.includes(globalIndex)) return;

    setSelectedIndices(prev => {
      if (prev.includes(globalIndex)) return prev;
      return [...prev, globalIndex];
    });
  }, [visiblePositions]);

  // Handle swipe end - speak the selected letters as a word/phrase
  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (selectedIndices.length === 0) {
      setSelectedIndices([]);
      return;
    }

    // Build the selected text
    const sorted = [...selectedIndices].sort((a, b) => a - b);
    let text = '';
    for (const idx of sorted) {
      const char = phrase[idx];
      if (char && /[A-Z]/i.test(char)) {
        text += char;
      }
    }

    if (text.length > 0) {
      // Speak it slowly, letter by letter for short, or as word for longer
      if (text.length <= 2) {
        speak(text.split('').join(' ... '), { rate: 0.8 });
      } else {
        speak(text, { rate: 0.85 });
      }
    }

    // Clear selection after a moment
    setTimeout(() => setSelectedIndices([]), 500);
  }, [selectedIndices, phrase]);

  const renderLetter = (char: string, globalIndex: number) => {
    const isRevealed = visiblePositions.includes(globalIndex);
    const isLetter = /[A-Z]/.test(char);
    const isPunctuation = /[^A-Z ]/.test(char);
    const isSelected = selectedIndices.includes(globalIndex);

    if (char === ' ') return <div key={globalIndex} className="w-6 h-8 sm:w-10 sm:h-14" />;

    return (
      <div
        key={globalIndex}
        ref={el => { tileRefsArray.current[globalIndex] = el; }}
        className={`w-6 h-8 sm:w-10 sm:h-14 border border-gray-300 m-0.5 flex items-center justify-center text-base sm:text-2xl font-bold shadow-md bg-white overflow-hidden transition-all ${
          isSelected ? 'ring-2 ring-yellow-400 scale-110 z-10' : ''
        } ${isRevealed && isLetter ? 'cursor-pointer hover:bg-blue-50 active:bg-blue-100' : ''}`}
        onClick={() => isLetter && handleLetterClick(char, globalIndex)}
        onTouchStart={() => isLetter && handleSwipeStart(globalIndex)}
        onTouchMove={(e) => {
          // Find which element we're over
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const idx = tileRefsArray.current.findIndex(ref => ref === element);
          if (idx >= 0) handleSwipeMove(idx);
        }}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={() => isLetter && handleSwipeStart(globalIndex)}
        onMouseEnter={() => isLetter && handleSwipeMove(globalIndex)}
        onMouseUp={handleSwipeEnd}
      >
        {isPunctuation ? (
          <span className="text-black">{char}</span>
        ) : isLetter ? (
          <AnimatePresence mode="wait">
            {isRevealed && (
              <motion.div
                key={`revealed-${globalIndex}`}
                initial={{ backgroundColor: '#2563eb' }}
                animate={{ backgroundColor: isSelected ? '#fef08a' : '#ffffff' }}
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
        className="flex flex-col items-center justify-center p-1 sm:p-2 bg-game-board rounded-lg sm:rounded-xl border-2 sm:border-4 border-yellow-500 shadow-2xl w-full max-w-5xl mx-auto relative overflow-hidden select-none"
        onMouseLeave={handleSwipeEnd}
      >
        {/* Vanna positioned in lower right of board */}
        <div className="absolute bottom-2 right-2 z-40 w-16 h-16 pointer-events-none">
          <Vanna
            revealedPositions={revealedPositions}
            tileRefs={tileRefsArray}
            isPuzzleSolved={isPuzzleSolved}
            onTileVisited={handleTileVisited}
            dressColorId={dressColorId}
            hairColorId={hairColorId}
          />
        </div>

        {/* Instructions hint */}
        {readAloudEnabled && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-white/60 bg-black/30 px-2 py-0.5 rounded-full">
            Tap letter to hear • Swipe to hear word
          </div>
        )}

        <div className="flex flex-col gap-1 sm:gap-2 w-full mt-3">
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
