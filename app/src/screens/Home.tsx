/**
 * Home Screen
 *
 * Landing screen for Standard Mode. An editorial, type-led index of the three
 * rounds: a flat board-ink surface, a confident wordmark, and a numbered list
 * with hairline rules. No cards, no gradient, no icons.
 *
 * Each row is a real `<button>` for keyboard + screen-reader accessibility and
 * invokes `onSelectMode(mode)` with the corresponding RoundType.
 */

import React from 'react';
import { RoundType } from '../engine/types';

export interface ModeCard {
  mode: RoundType;
  title: string;
  description: string;
}

export const MODE_CARDS: readonly ModeCard[] = [
  {
    mode: 'MAIN',
    title: 'Main Game',
    description: 'Spin the wheel, call letters, solve the puzzle.',
  },
  {
    mode: 'TOSSUP',
    title: 'Toss-Up',
    description: 'Letters reveal one at a time. Buzz in to solve first.',
  },
  {
    mode: 'BONUS',
    title: 'Bonus Round',
    description: 'RSTLNE, then three consonants and a vowel.',
  },
] as const;

export interface HomeProps {
  onSelectMode: (mode: RoundType) => void;
}

export function Home({ onSelectMode }: HomeProps): React.ReactElement {
  return (
    <div
      data-testid="home-screen"
      className="min-h-screen w-full bg-wof-ink text-text-primary flex flex-col justify-center px-6 py-12"
    >
      <div className="w-full max-w-lg mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            Wheel Practice
          </h1>
          <p className="mt-4 text-lg text-text-secondary">Three rounds. Pick one.</p>
        </header>

        <ul role="list" className="border-t border-white/10">
          {MODE_CARDS.map((card, i) => (
            <li key={card.mode}>
              <button
                type="button"
                onClick={() => onSelectMode(card.mode)}
                data-testid={`mode-card-${card.mode}`}
                aria-label={`${card.title}. ${card.description}`}
                className="group flex w-full items-baseline gap-5 border-b border-white/10 py-6 text-left transition-colors duration-200 ease-out hover:bg-white/[0.02] focus:outline-none focus-visible:bg-white/[0.04]"
              >
                <span className="shrink-0 pt-1 font-mono text-sm tabular-nums text-wof-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-semibold tracking-tight transition-colors group-hover:text-wof-gold">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-sm text-text-secondary">
                    {card.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-text-muted transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-wof-gold"
                >
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
