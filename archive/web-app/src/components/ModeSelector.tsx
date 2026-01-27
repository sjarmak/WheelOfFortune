/**
 * Mode Selector Component
 *
 * Prominent toggle for choosing between Standard and Kid Mode.
 * - Big, friendly buttons
 * - Clear visual difference
 * - Shows on home screen
 */

import React, { useState, useEffect } from 'react';
import { GameMode } from '../engine/types';
import { Star, Trophy, Baby, Sparkles } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onClose: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  onClose
}) => {
  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Choose Your Mode
        </h2>

        <div className="grid gap-4">
          {/* Standard Mode */}
          <button
            onClick={() => {
              onSelectMode('STANDARD');
              onClose();
            }}
            className={`
              p-6 rounded-xl text-left transition-all duration-200
              ${currentMode === 'STANDARD'
                ? 'bg-gradient-to-r from-blue-600 to-blue-800 ring-4 ring-blue-400'
                : 'bg-slate-700 hover:bg-slate-600'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-full">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Standard Mode</h3>
                <p className="text-white/70 text-sm mt-1">
                  Classic Wheel of Fortune rules with money, bankrupt, and full challenge!
                </p>
              </div>
            </div>
            {currentMode === 'STANDARD' && (
              <div className="mt-3 text-sm text-blue-200 font-medium">
                ✓ Currently selected
              </div>
            )}
          </button>

          {/* Kid Mode */}
          <button
            onClick={() => {
              onSelectMode('KID');
              onClose();
            }}
            className={`
              p-6 rounded-xl text-left transition-all duration-200
              ${currentMode === 'KID'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 ring-4 ring-yellow-400'
                : 'bg-slate-700 hover:bg-slate-600'
              }
              ${!reduceMotion && currentMode !== 'KID' ? 'hover:scale-[1.02]' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-white/10 rounded-full ${!reduceMotion ? 'animate-pulse' : ''}`}>
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Kid Mode
                  <Baby className="w-5 h-5 text-pink-300" />
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  Fun for little ones! Earn stars, get hints, and no losing!
                </p>
              </div>
            </div>
            {currentMode === 'KID' && (
              <div className="mt-3 text-sm text-yellow-100 font-medium flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> Currently selected
              </div>
            )}
          </button>
        </div>

        {/* Features comparison */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <h4 className="font-bold text-white mb-2">Standard Mode</h4>
            <ul className="text-white/60 space-y-1">
              <li>• Money scoring</li>
              <li>• Bankrupt risk</li>
              <li>• All puzzles</li>
              <li>• Full challenge</li>
            </ul>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1">
              Kid Mode <Star className="w-3 h-3 text-yellow-400" />
            </h4>
            <ul className="text-white/60 space-y-1">
              <li>• Star rewards</li>
              <li>• No penalties</li>
              <li>• Helpful hints</li>
              <li>• Read aloud</li>
            </ul>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-bold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/**
 * Small mode indicator for the header
 */
interface ModeIndicatorProps {
  mode: GameMode;
  onClick: () => void;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode, onClick }) => {
  if (mode === 'KID') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full text-white text-xs font-bold shadow-lg"
        aria-label="Kid Mode - click to change mode"
      >
        <Sparkles className="w-3 h-3" />
        KID
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded-full text-white text-xs font-bold shadow"
      aria-label="Standard Mode - click to change mode"
    >
      <Trophy className="w-3 h-3" />
      Standard Mode
    </button>
  );
};
