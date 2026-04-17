/**
 * Letter Suggestions Component
 *
 * Shows 3 suggested letters as big, tappable buttons.
 * Used for:
 * - "Choose for me" helper during normal play
 * - CHOOSE_LETTER wheel outcome
 */

import React, { useEffect, useState } from 'react';
import { speakSuggestions, isTTSAvailable } from '../engine/tts';

interface LetterSuggestionsProps {
  letters: string[];
  onSelect: (letter: string) => void;
  disabled?: boolean;
  title?: string;
  readAloudEnabled?: boolean;
  autoSpeak?: boolean;
}

export const LetterSuggestions: React.FC<LetterSuggestionsProps> = ({
  letters,
  onSelect,
  disabled = false,
  title = 'Try one of these!',
  readAloudEnabled = true,
  autoSpeak = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Auto-speak on mount
  useEffect(() => {
    if (autoSpeak && readAloudEnabled && isTTSAvailable() && letters.length > 0) {
      speakSuggestions(letters);
    }
  }, [autoSpeak, readAloudEnabled, letters]);

  const handleSelect = (letter: string, index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
    setTimeout(() => {
      onSelect(letter);
      setSelectedIndex(null);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent, letter: string, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(letter, index);
    }
  };

  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  if (letters.length === 0) {
    return null;
  }

  return (
    <div className="w-full p-2">
      <p className="text-center text-white/80 text-sm mb-2">{title}</p>
      <div className="flex justify-center gap-3">
        {letters.map((letter, i) => (
          <button
            key={letter}
            onClick={() => handleSelect(letter, i)}
            onKeyDown={(e) => handleKeyDown(e, letter, i)}
            disabled={disabled}
            className={`
              w-16 h-16 sm:w-20 sm:h-20
              text-3xl sm:text-4xl font-bold
              rounded-xl shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-4 focus:ring-yellow-400
              ${disabled
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : selectedIndex === i
                  ? 'bg-green-400 text-white scale-110'
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white hover:scale-105 active:scale-95'
              }
              ${!reduceMotion && !disabled ? 'animate-pulse' : ''}
            `}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '2s'
            }}
            aria-label={`Guess letter ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Keyboard hint for desktop */}
      <p className="text-center text-white/50 text-xs mt-2 hidden sm:block">
        Or type a letter on your keyboard
      </p>
    </div>
  );
};
