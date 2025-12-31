import React from 'react';
import clsx from 'clsx';

interface KeyboardProps {
  guessedLetters: string[];
  onGuess: (letter: string) => void;
  disabled: boolean;
  vowelsOnly?: boolean;
  consonantsOnly?: boolean;
}

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

export const Keyboard: React.FC<KeyboardProps> = ({ 
  guessedLetters, 
  onGuess, 
  disabled, 
  vowelsOnly = false,
  consonantsOnly = false
}) => {
  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto p-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-2">
          {row.map(char => {
            const isGuessed = guessedLetters.includes(char);
            const isVowel = VOWELS.includes(char);
            
            let isAllowed = !isGuessed && !disabled;
            if (vowelsOnly && !isVowel) isAllowed = false;
            if (consonantsOnly && isVowel) isAllowed = false;

            return (
              <button
                key={char}
                onClick={() => onGuess(char)}
                disabled={!isAllowed}
                className={clsx(
                  "w-8 h-10 sm:w-10 sm:h-12 rounded font-bold text-sm sm:text-base transition-colors",
                  isGuessed 
                    ? "bg-slate-700 text-slate-500 opacity-50" 
                    : isAllowed 
                      ? "bg-white text-slate-900 hover:bg-slate-200 active:bg-slate-300 shadow"
                      : "bg-slate-800 text-slate-600 opacity-50"
                )}
              >
                {char}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
