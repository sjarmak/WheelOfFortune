/**
 * Wheel Legend Component
 *
 * Shows clickable emoji icons that explain what each wheel outcome means.
 * Kids can tap an emoji to hear what it does.
 */

import React from 'react';
import { speak } from '../engine/tts';

interface LegendItem {
  emoji: string;
  label: string;
  spoken: string;
  color: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { emoji: '🔤', label: 'Guess', spoken: 'Guess a letter! Pick any letter you want!', color: '#4CAF50' },
  { emoji: '✌️', label: '2 Guesses', spoken: 'Two guesses! You get to pick two letters!', color: '#00BCD4' },
  { emoji: '🌟', label: 'Vowel+', spoken: 'Vowel plus! Pick a vowel, then pick another letter!', color: '#FF6B6B' },
  { emoji: '🎯', label: 'Pick 3', spoken: 'Pick from three! Choose one of three letters!', color: '#9C27B0' },
  { emoji: '🎁', label: 'Free', spoken: 'Free letter! We show you a letter!', color: '#FFD700' },
  { emoji: '💡', label: 'Hint', spoken: 'Hint! Get help solving the puzzle!', color: '#3F51B5' },
];

interface WheelLegendProps {
  readAloudEnabled: boolean;
  horizontal?: boolean;
}

export const WheelLegend: React.FC<WheelLegendProps> = ({ readAloudEnabled, horizontal = false }) => {
  const handleClick = (item: LegendItem) => {
    if (readAloudEnabled) {
      speak(item.spoken, { rate: 0.85, pitch: 1.2 });
    }
  };

  if (horizontal) {
    return (
      <div className="flex flex-wrap justify-center gap-2 bg-black/30 rounded-2xl p-2">
        {LEGEND_ITEMS.map((item) => (
          <button
            key={item.emoji}
            onClick={() => handleClick(item)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: `${item.color}30` }}
            aria-label={`${item.label}: ${item.spoken}`}
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-white/90">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 bg-black/30 rounded-2xl p-2">
      <div className="text-xs text-white/70 text-center font-medium mb-1">
        Tap to hear!
      </div>
      {LEGEND_ITEMS.map((item) => (
        <button
          key={item.emoji}
          onClick={() => handleClick(item)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: `${item.color}30` }}
          aria-label={`${item.label}: ${item.spoken}`}
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-xs font-bold text-white/90">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
