/**
 * Hear Words Component
 *
 * Simple tap-to-hear buttons for each word in the puzzle.
 * Much easier for young kids than swiping.
 */

import React from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../engine/tts';

interface HearWordsProps {
  phrase: string;
  revealedPositions: number[];
  readAloudEnabled: boolean;
}

export const HearWords: React.FC<HearWordsProps> = ({
  phrase,
  revealedPositions,
  readAloudEnabled
}) => {
  const words = phrase.split(' ');

  // Calculate which words are fully revealed
  let charIndex = 0;
  const wordInfo = words.map((word) => {
    const startIdx = charIndex;
    const letters = word.split('');
    const revealedLetters: string[] = [];
    let isFullyRevealed = true;

    letters.forEach((char, i) => {
      if (/[A-Z]/i.test(char)) {
        if (revealedPositions.includes(startIdx + i)) {
          revealedLetters.push(char);
        } else {
          revealedLetters.push('_');
          isFullyRevealed = false;
        }
      } else {
        revealedLetters.push(char);
      }
    });

    charIndex += word.length + 1; // +1 for space

    return {
      word,
      display: revealedLetters.join(''),
      isFullyRevealed,
      hasAnyRevealed: revealedLetters.some(l => l !== '_')
    };
  });

  const handleSpeak = (text: string, isFullWord: boolean) => {
    if (!readAloudEnabled) return;

    if (isFullWord) {
      speak(text, { rate: 0.8 });
    } else {
      // Spell out revealed letters
      const spelled = text.split('').map(c => c === '_' ? 'blank' : c).join(' ... ');
      speak(spelled, { rate: 0.7 });
    }
  };

  const handleSpeakAll = () => {
    if (!readAloudEnabled) return;

    const fullyRevealed = wordInfo.every(w => w.isFullyRevealed);
    if (fullyRevealed) {
      speak(phrase, { rate: 0.85 });
    } else {
      // Speak each word with blanks
      const spoken = wordInfo.map(w => {
        if (w.isFullyRevealed) return w.word;
        return w.display.split('').map(c => c === '_' ? 'blank' : c).join(' ');
      }).join(' ... next word ... ');
      speak(spoken, { rate: 0.75 });
    }
  };

  return (
    <div className="bg-black/30 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/70 font-medium">
          👆 Tap a word to hear it!
        </span>
        <button
          onClick={handleSpeakAll}
          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white"
          disabled={!readAloudEnabled}
        >
          <Volume2 className="w-3 h-3" />
          Hear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {wordInfo.map((info, idx) => (
          <button
            key={idx}
            onClick={() => handleSpeak(info.isFullyRevealed ? info.word : info.display, info.isFullyRevealed)}
            disabled={!readAloudEnabled || !info.hasAnyRevealed}
            className={`px-3 py-2 rounded-xl font-bold text-lg transition-all ${
              info.isFullyRevealed
                ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg hover:scale-105'
                : info.hasAnyRevealed
                  ? 'bg-yellow-500/50 hover:bg-yellow-500/70 text-white'
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {info.isFullyRevealed ? info.word : info.display}
          </button>
        ))}
      </div>

      {wordInfo.every(w => w.isFullyRevealed) && (
        <div className="text-center mt-2 text-green-300 text-sm font-medium">
          ✅ All words revealed!
        </div>
      )}
    </div>
  );
};
