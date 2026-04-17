/**
 * Word Builder Component
 *
 * Kid-friendly solve mode where children build words one at a time:
 * - Shows word slots with blanks
 * - Child taps letters to fill blanks
 * - "Check" button validates the word
 * - Positive feedback only (no penalties)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { X, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { speak, isTTSAvailable } from '../engine/tts';

interface WordBuilderProps {
  phrase: string;
  currentWordIndex: number;
  inputLetters: string[];
  revealedPositions: number[];
  onInputLetter: (letter: string) => void;
  onClear: () => void;
  onCheck: () => void;
  onNextWord: () => void;
  onExit: () => void;
  readAloudEnabled: boolean;
}

export const WordBuilder: React.FC<WordBuilderProps> = ({
  phrase,
  currentWordIndex,
  inputLetters,
  revealedPositions,
  onInputLetter,
  onClear,
  onCheck,
  onNextWord,
  onExit,
  readAloudEnabled
}) => {
  const [feedback, setFeedback] = useState<'correct' | 'try-again' | null>(null);

  // Parse phrase into words with positions
  const words = useMemo(() => {
    const result: Array<{
      word: string;
      startPos: number;
      letterPositions: number[];
      isRevealed: boolean;
    }> = [];

    let pos = 0;
    for (const word of phrase.split(' ')) {
      const letterPositions: number[] = [];
      for (let i = 0; i < word.length; i++) {
        if (/[A-Z]/i.test(word[i])) {
          letterPositions.push(pos + i);
        }
      }

      const isRevealed = letterPositions.every(p => revealedPositions.includes(p));

      result.push({
        word,
        startPos: pos,
        letterPositions,
        isRevealed
      });

      pos += word.length + 1; // +1 for space
    }

    return result;
  }, [phrase, revealedPositions]);

  const currentWord = words[currentWordIndex];
  const targetLetters = currentWord?.word.toUpperCase().replace(/[^A-Z]/g, '') || '';

  // Check if current word is already revealed
  const isCurrentWordRevealed = currentWord?.isRevealed ?? true;

  // Find next unrevealed word
  const nextUnrevealedIndex = words.findIndex(
    (w, i) => i > currentWordIndex && !w.isRevealed
  );

  // Handle check with feedback
  const handleCheck = () => {
    const inputWord = inputLetters.join('');
    if (inputWord === targetLetters) {
      setFeedback('correct');
      if (readAloudEnabled && isTTSAvailable()) {
        speak('Great job!', { pitch: 1.3 });
      }
      setTimeout(() => {
        setFeedback(null);
        onCheck();
      }, 1000);
    } else {
      setFeedback('try-again');
      if (readAloudEnabled && isTTSAvailable()) {
        speak('Nice try! Keep going!', { pitch: 1.0 });
      }
      setTimeout(() => {
        setFeedback(null);
        onClear();
      }, 1500);
    }
  };

  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  // Keyboard rows
  const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Build the Words!</h2>
        <button
          onClick={onExit}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full"
          aria-label="Exit word builder"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Word progress */}
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {words.map((w, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded text-sm ${
              i === currentWordIndex
                ? 'bg-yellow-500 text-black font-bold'
                : w.isRevealed
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Current word display */}
      {currentWord && !isCurrentWordRevealed && (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Word slots */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center">
            {targetLetters.split('').map((_, i) => {
              const inputLetter = inputLetters[i];
              return (
                <div
                  key={i}
                  className={`
                    w-12 h-14 sm:w-14 sm:h-16
                    flex items-center justify-center
                    text-2xl sm:text-3xl font-bold
                    rounded-lg border-4
                    ${inputLetter
                      ? feedback === 'correct'
                        ? 'bg-green-500 border-green-400 text-white'
                        : feedback === 'try-again'
                          ? 'bg-red-400 border-red-300 text-white'
                          : 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-gray-700 border-gray-500 text-gray-400'
                    }
                    transition-all duration-200
                    ${!reduceMotion && inputLetter ? 'animate-pulse' : ''}
                  `}
                  style={{ animationDuration: '1s' }}
                >
                  {inputLetter || '_'}
                </div>
              );
            })}
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className={`text-2xl font-bold mb-4 ${
              feedback === 'correct' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {feedback === 'correct' ? '🎉 Great Job!' : '👍 Nice Try!'}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={onClear}
              disabled={inputLetters.length === 0}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold flex items-center gap-2"
              aria-label="Clear word"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleCheck}
              disabled={inputLetters.length !== targetLetters.length}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold flex items-center gap-2"
              aria-label="Check word"
            >
              <Check className="w-4 h-4" />
              Check!
            </button>
          </div>

          {/* Keyboard */}
          <div className="flex flex-col gap-1 w-full max-w-md">
            {ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map(letter => (
                  <button
                    key={letter}
                    onClick={() => onInputLetter(letter)}
                    disabled={inputLetters.length >= targetLetters.length}
                    className="w-8 h-10 sm:w-9 sm:h-11 bg-white hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-500 text-black font-bold rounded text-sm sm:text-base transition-colors"
                    aria-label={`Type letter ${letter}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word already revealed or all done */}
      {(isCurrentWordRevealed && nextUnrevealedIndex >= 0) && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xl text-white mb-4">
            Word {currentWordIndex + 1} is done!
          </p>
          <button
            onClick={onNextWord}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2"
            aria-label="Go to next word"
          >
            <ArrowRight className="w-5 h-5" />
            Next Word
          </button>
        </div>
      )}

      {/* All words revealed */}
      {words.every(w => w.isRevealed) && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-2xl text-green-400 font-bold mb-4">
            🎉 All Words Complete! 🎉
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};
