/**
 * Kid Mode HUD Component
 *
 * Displays kid-friendly game status:
 * - Stars earned (with animated counter)
 * - Hint meter (visual progress)
 * - Speak buttons for TTS
 * - Nudge message when stuck
 */

import React from 'react';
import { Volume2 } from 'lucide-react';
import { speakCategory, speakPuzzle, isTTSAvailable } from '../engine/tts';

interface KidModeHUDProps {
  category: string;
  phrase: string;
  revealedPositions: number[];
  isSolved: boolean;
  readAloudEnabled: boolean;
}

export const KidModeHUD: React.FC<KidModeHUDProps> = ({
  category,
  phrase,
  revealedPositions,
  isSolved,
  readAloudEnabled
}) => {
  const ttsAvailable = isTTSAvailable();

  const handleSpeakCategory = () => {
    if (ttsAvailable && readAloudEnabled) {
      speakCategory(category);
    }
  };

  const handleSpeakPuzzle = () => {
    if (ttsAvailable && readAloudEnabled) {
      speakPuzzle(phrase, revealedPositions, isSolved);
    }
  };

  return (
    <div className="w-full px-2 py-1">
      {/* Top bar: Speak buttons only */}
      {ttsAvailable && readAloudEnabled && (
        <div className="flex gap-2 mb-2 justify-center">
          <button
            onClick={handleSpeakCategory}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-400 rounded-full shadow transition-colors text-xs font-bold text-white"
            title="Read category aloud"
            aria-label="Read category aloud"
          >
            <Volume2 className="w-3 h-3" />
            <span>Category</span>
          </button>
          <button
            onClick={handleSpeakPuzzle}
            className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-400 rounded-full shadow transition-colors text-xs font-bold text-white"
            title="Read puzzle letters aloud"
            aria-label="Read puzzle aloud"
          >
            <Volume2 className="w-3 h-3" />
            <span>Puzzle</span>
          </button>
        </div>
      )}


    </div>
  );
};
