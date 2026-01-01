import React, { useMemo } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface BoardProps {
  phrase: string;
  revealedPositions: number[];
  category: string;
}

export const Board: React.FC<BoardProps> = ({ phrase, revealedPositions, category }) => {
  // Split phrase into words to wrap nicely
  const words = useMemo(() => phrase.split(' '), [phrase]);
  
  // A standard board is 12x4 or 14x4 roughly, but we can be dynamic for mobile
  // We'll just flow them in a container that looks like the board.
  
  const renderLetter = (char: string, _index: number, globalIndex: number) => {
    const isRevealed = revealedPositions.includes(globalIndex);
    const isLetter = /[A-Z]/.test(char);
    const isPunctuation = /[^A-Z ]/.test(char);

    if (char === ' ') return <div key={globalIndex} className="w-8 h-10 sm:w-10 sm:h-14" />;

    return (
      <div 
        key={globalIndex} 
        className={clsx(
          "w-8 h-10 sm:w-10 sm:h-14 border border-white m-0.5 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-md",
          "bg-white text-black transition-colors duration-500",
          !isLetter && !isPunctuation ? "opacity-0" : "", // Should not happen with trim
          isLetter && !isRevealed ? "bg-green-800" : "bg-white" // Green board vs revealed white
        )}
      >
        <motion.span
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ 
            opacity: (isRevealed || isPunctuation) ? 1 : 0, 
            rotateY: (isRevealed || isPunctuation) ? 0 : 90 
          }}
          transition={{ duration: 0.4 }}
        >
          {char}
        </motion.span>
      </div>
    );
  };

  // Reconstruct full flattened render to manage indices easily
  
  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 bg-game-board rounded-xl border-4 border-yellow-500 shadow-2xl w-full max-w-4xl mx-auto min-h-[200px]">
      <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 sm:gap-x-3 sm:gap-y-2 w-full">
        {words.reduce((acc, word, wordIdx) => {
          // Calculate the starting position of this word in the original phrase
          const wordStartIndex = phrase.split(' ').slice(0, wordIdx).reduce((sum, w) => sum + w.length + 1, 0);
          
          acc.push(
            <div key={wordIdx} className="flex gap-x-0">
              {word.split('').map((char, charIdx) => {
                const globalIndex = wordStartIndex + charIdx;
                return renderLetter(char, charIdx, globalIndex);
              })}
            </div>
          );
          return acc;
        }, [] as React.ReactNode[])}
      </div>
      <div className="mt-4 sm:mt-6 bg-blue-900 px-4 sm:px-6 py-1 sm:py-2 rounded-full border-2 border-white text-white font-bold text-xs sm:text-sm tracking-widest uppercase">
        {category.replace(/_/g, ' ')}
      </div>
    </div>
  );
};
