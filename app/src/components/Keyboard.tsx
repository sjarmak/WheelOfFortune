import React from 'react';
import clsx from 'clsx';

interface KeyboardProps {
  guessedLetters: string[];
  onGuess: (letter: string) => void;
  disabled: boolean;
  vowelsOnly?: boolean;
  consonantsOnly?: boolean;
  highlightVowels?: boolean;
  large?: boolean;
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
  consonantsOnly = false,
  highlightVowels = false,
  large = false
}) => {
  return (
    <div className={clsx(
      "flex flex-col w-full mx-auto px-2 sm:px-3 py-1 flex-shrink overflow-hidden",
      large ? "gap-2" : "gap-1 sm:gap-1.5"
    )}>
      {ROWS.map((row, i) => (
        <div key={i} className={clsx(
          "flex justify-center",
          large ? "gap-2" : "gap-1 sm:gap-1.5"
        )}>
          {row.map(char => {
            const isGuessed = guessedLetters.includes(char);
            const isVowel = VOWELS.includes(char);

            let isAllowed = !isGuessed && !disabled;
            if (vowelsOnly && !isVowel) isAllowed = false;
            if (consonantsOnly && isVowel) isAllowed = false;

            // Vowel highlighting styles - only highlight if keyboard is enabled
            const vowelHighlight = highlightVowels && isVowel && !isGuessed && !disabled;

            return (
              <button
                key={char}
                onClick={() => onGuess(char)}
                disabled={!isAllowed}
                className={clsx(
                  "rounded font-bold transition-all flex-shrink-0",
                  large
                    ? "w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl"
                    : "w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12 text-sm sm:text-base",
                  isGuessed
                    ? "bg-slate-700 text-slate-500 opacity-50"
                    : vowelHighlight
                      ? "bg-gradient-to-b from-yellow-300 to-orange-400 text-black shadow-lg ring-2 ring-yellow-200 animate-pulse hover:scale-110"
                      : isAllowed
                        ? "bg-white text-slate-900 hover:bg-slate-200 active:bg-slate-300 shadow hover:scale-105"
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
