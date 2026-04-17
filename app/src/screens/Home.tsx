/**
 * Home Screen
 *
 * Landing screen for Standard Mode. Presents three selectable mode cards
 * (Main Game, Toss-Up, Bonus Round) mirroring the iOS ModeSelector design
 * using the dark-theme Tailwind tokens.
 *
 * Each card is a real `<button>` for keyboard + screen-reader accessibility
 * and invokes `onSelectMode(mode)` with the corresponding RoundType.
 */

import React from 'react';
import { Trophy, Zap, Award } from 'lucide-react';
import { RoundType } from '../engine/types';

export interface ModeCard {
  mode: RoundType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradientClass: string;
  accentClass: string;
}

export const MODE_CARDS: readonly ModeCard[] = [
  {
    mode: 'MAIN',
    title: 'Main Game',
    description: 'Spin the wheel, call letters, and solve puzzles.',
    icon: Trophy,
    gradientClass: 'from-primary-700 to-primary-900',
    accentClass: 'text-accent-yellow',
  },
  {
    mode: 'TOSSUP',
    title: 'Toss-Up',
    description: 'Letters reveal one at a time — buzz in to solve first.',
    icon: Zap,
    gradientClass: 'from-accent-pink to-primary-700',
    accentClass: 'text-accent-yellow',
  },
  {
    mode: 'BONUS',
    title: 'Bonus Round',
    description: 'Classic RSTLNE + three consonants + one vowel challenge.',
    icon: Award,
    gradientClass: 'from-accent-orange to-accent-pink',
    accentClass: 'text-accent-yellow',
  },
] as const;

export interface HomeProps {
  onSelectMode: (mode: RoundType) => void;
}

export function Home({ onSelectMode }: HomeProps): React.ReactElement {
  return (
    <div
      data-testid="home-screen"
      className="min-h-screen w-full bg-ios-dark text-text-primary flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-accent-yellow">
            WHEEL PRACTICE
          </h1>
          <p className="mt-2 text-text-secondary text-base">
            Choose a round to play
          </p>
        </header>

        <div className="grid gap-4" role="list" aria-label="Game modes">
          {MODE_CARDS.map((card) => (
            <ModeButton
              key={card.mode}
              card={card}
              onClick={() => onSelectMode(card.mode)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  card: ModeCard;
  onClick: () => void;
}

function ModeButton({ card, onClick }: ModeButtonProps): React.ReactElement {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`mode-card-${card.mode}`}
      aria-label={`${card.title} — ${card.description}`}
      className={`
        group relative w-full text-left rounded-2xl p-6
        bg-gradient-to-br ${card.gradientClass}
        shadow-lg ring-1 ring-white/10
        transition-transform duration-150
        hover:scale-[1.02] focus:scale-[1.02]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow
      `}
      role="listitem"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-full flex-shrink-0">
          <Icon className={`w-8 h-8 ${card.accentClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-text-primary">{card.title}</h2>
          <p className="mt-1 text-sm text-text-primary/80">
            {card.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default Home;
