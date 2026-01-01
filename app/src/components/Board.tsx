import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardProps {
  phrase: string;
  revealedPositions: number[];
  category: string;
  puzzleId?: string;
}

export const Board: React.FC<BoardProps> = ({ phrase, revealedPositions, category, puzzleId }) => {
  const words = useMemo(() => phrase.split(' '), [phrase]);

  const renderLetter = (char: string, globalIndex: number) => {
    const isRevealed = revealedPositions.includes(globalIndex);
    const isLetter = /[A-Z]/.test(char);
    const isPunctuation = /[^A-Z ]/.test(char);

    if (char === ' ') return <div key={globalIndex} className="w-7 h-9 sm:w-11 sm:h-16" />;

    return (
      <div 
        key={globalIndex} 
        className="w-7 h-9 sm:w-11 sm:h-16 border border-gray-300 m-0.5 flex items-center justify-center text-lg sm:text-3xl font-bold shadow-md bg-white overflow-hidden"
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
        className="flex flex-col items-center justify-center p-1.5 sm:p-3 bg-game-board rounded-lg sm:rounded-xl border-2 sm:border-4 border-yellow-500 shadow-2xl w-full max-w-5xl mx-auto"
        >
        <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 sm:gap-x-2 sm:gap-y-2 w-full">
          {words.reduce((acc, word, wordIdx) => {
             const wordStartIndex = phrase.split(' ').slice(0, wordIdx).reduce((sum, w) => sum + w.length + 1, 0);
             
             acc.push(
               <div key={wordIdx} className="flex gap-x-0">
                 {word.split('').map((char, charIdx) => {
                   const globalIndex = wordStartIndex + charIdx;
                   return renderLetter(char, globalIndex);
                 })}
               </div>
             );
             return acc;
           }, [] as React.ReactNode[])}
         </div>
         <div className="mt-1 sm:mt-2 bg-blue-900 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white sm:border-2 text-white font-bold text-xs sm:text-sm tracking-widest uppercase">
          {category.replace(/_/g, ' ')}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
