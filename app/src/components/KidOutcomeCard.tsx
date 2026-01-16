/**
 * Kid Outcome Card Component
 *
 * Displays wheel outcomes in a fun, animated card.
 * - Large emoji
 * - Colorful background
 * - Friendly message
 * - Tap to continue
 */

import React, { useEffect, useState } from 'react';
import { KidWedgeOutcome } from '../engine/kidTypes';
import { speakOutcome, isTTSAvailable } from '../engine/tts';
import { Type, Target, Star, Lightbulb, Gift, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KidOutcomeCardProps {
  outcome: KidWedgeOutcome;
  onDismiss: () => void;
  readAloudEnabled: boolean;
}

const outcomeMessages: Record<string, string[]> = {
  'GUESS_ANY': ['Your turn!', 'Pick a letter!', 'Guess time!'],
  'GUESS_TWO': ['Two guesses!', 'Double fun!', 'Pick two!'],
  'VOWEL_PLUS': ['Vowel plus!', 'Special turn!', 'Two picks!'],
  'PICK_THREE': ['Choose one!', 'Pick from 3!', 'Your choice!'],
  'FREE_LETTER': ['Free letter!', 'Lucky you!', 'Surprise!'],
  'BONUS_STAR': ['Star time!', 'Bonus star!', 'Yay!'],
  'HINT_TOKEN': ['Free hint!', 'Hint power!', 'Lucky you!']
};

const outcomeIcons: Record<KidWedgeOutcome['type'], LucideIcon> = {
  GUESS_ANY: Type,
  GUESS_TWO: Type,
  VOWEL_PLUS: Sparkles,
  PICK_THREE: Target,
  FREE_LETTER: Gift,
  BONUS_STAR: Star,
  HINT_TOKEN: Lightbulb
};

export const KidOutcomeCard: React.FC<KidOutcomeCardProps> = ({
  outcome,
  onDismiss,
  readAloudEnabled
}) => {
  const [showSparkles, setShowSparkles] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Pick random message
    const messages = outcomeMessages[outcome.type] || ['Great!'];
    setMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Show sparkles
    setShowSparkles(true);
    const timer = setTimeout(() => setShowSparkles(false), 1000);

    // Speak outcome
    if (readAloudEnabled && isTTSAvailable()) {
      speakOutcome(outcome.label, outcome.emoji);
    }

    return () => clearTimeout(timer);
  }, [outcome, readAloudEnabled]);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 1800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={`You got ${outcome.label}`}
    >
      <div
        className={`relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform ${
          reduceMotion ? '' : 'animate-bounce'
        }`}
        style={{ animationDuration: '0.5s', animationIterationCount: '2' }}
      >
        {/* Sparkles background */}
        {showSparkles && !reduceMotion && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}

        {/* Icon */}
        <div className={`mb-4 ${reduceMotion ? '' : 'animate-pulse'}`}>
          {React.createElement(outcomeIcons[outcome.type] ?? Star, {
            className: 'w-16 h-16 text-white'
          })}
        </div>

        {/* Label */}
        <h2
          className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {outcome.label}
        </h2>

        {/* Message */}
        <p className="text-xl text-white/90 mb-4">
          {message}
        </p>

        {/* Star/value indicator */}
        {outcome.type === 'BONUS_STAR' && (
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: outcome.value }).map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-200" />
            ))}
          </div>
        )}

        {/* Tap to continue */}
        <p className="text-white/70 text-sm mt-4 animate-pulse">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};
