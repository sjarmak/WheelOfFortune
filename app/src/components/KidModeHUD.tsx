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
import { Star, Volume2, Lightbulb, Sparkles, DollarSign } from 'lucide-react';
import { KidModeState, HINT_METER_MAX, CASH_PER_STAR } from '../engine/kidTypes';
import { getCurrentHintType, getHintDescription } from '../engine/kidGame';
import { speakCategory, speakPuzzle, isTTSAvailable } from '../engine/tts';

interface KidModeHUDProps {
  kidState: KidModeState;
  category: string;
  phrase: string;
  revealedPositions: number[];
  isSolved: boolean;
  showNudge: boolean;
  onUseHint: () => void;
  readAloudEnabled: boolean;
}

export const KidModeHUD: React.FC<KidModeHUDProps> = ({
  kidState,
  category,
  phrase,
  revealedPositions,
  isSolved,
  showNudge,
  onUseHint,
  readAloudEnabled
}) => {
  const ttsAvailable = isTTSAvailable();
  const hintType = kidState.hintMeterUsed < HINT_METER_MAX
    ? getCurrentHintType({ kidState } as any)
    : null;
  const hintDescription = hintType ? getHintDescription(hintType) : null;
  const totalStars = kidState.stars + kidState.starsThisRound;
  const totalCash = totalStars * CASH_PER_STAR;
  const formattedCash = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(totalCash);

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
