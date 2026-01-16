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
      {/* Top bar: Stars and Speak buttons */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        {/* Stars display */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full shadow-inner">
          <Star className="w-4 h-4 text-yellow-300" />
          <div className="flex flex-col leading-none">
            <span className="text-[0.6rem] uppercase tracking-widest text-white/60">Stars</span>
            <span className="text-base font-bold text-white">{totalStars}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/80 to-orange-500/90 px-3 py-1.5 rounded-full shadow-lg">
          <DollarSign className="w-4 h-4 text-white" />
          <div className="flex flex-col leading-none">
            <span className="text-[0.6rem] uppercase tracking-widest text-white/80">Kid Winnings</span>
            <span className="text-base font-bold">{formattedCash}</span>
          </div>
        </div>

        {/* Speak buttons - with clear labels */}
        {ttsAvailable && readAloudEnabled && (
          <div className="flex gap-2">
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

      {/* Hint meter */}
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <div className="flex-1 flex gap-1">
          {Array.from({ length: HINT_METER_MAX }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                i < kidState.hintMeterUsed
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-400'
              }`}
            />
          ))}
        </div>
        {kidState.hintTokens > 0 && (
          <div className="flex items-center gap-1 bg-purple-500 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-bold">{kidState.hintTokens}</span>
          </div>
        )}
      </div>

      {/* Hint button */}
      {hintDescription && !isSolved && (
        <button
          onClick={onUseHint}
          className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            showNudge
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white animate-bounce'
              : 'bg-purple-600 hover:bg-purple-500 text-white'
          }`}
          aria-label={`Use hint: ${hintDescription}`}
        >
          <Lightbulb className="w-4 h-4" />
          {showNudge ? 'Try a Hint!' : hintDescription}
        </button>
      )}

      {/* Nudge message */}
      {showNudge && !isSolved && (
        <p className="text-center text-yellow-300 text-xs mt-1 animate-pulse">
          Need help? Use a hint!
        </p>
      )}
    </div>
  );
};
