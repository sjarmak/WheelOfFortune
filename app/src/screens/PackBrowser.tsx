/**
 * Pack Browser Screen
 *
 * Lists available puzzle packs using the dark-theme tokens.
 * Invokes `onSelectPack(pack)` when the user picks a pack.
 *
 * The list of packs is passed in explicitly (makes this trivially testable)
 * and defaults to ALL_PACKS from the engine when not provided.
 */

import React from 'react';
import { BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { ALL_PACKS, PuzzlePack } from '../engine/packs';

export interface PackBrowserProps {
  /** The packs to display. Defaults to ALL_PACKS from the puzzle engine. */
  packs?: PuzzlePack[];
  /** Called when the user selects a pack. */
  onSelectPack: (pack: PuzzlePack) => void;
  /** Optional back handler — if provided, renders a back button. */
  onBack?: () => void;
  /** Currently active pack id (highlights the card). */
  activePackId?: string;
}

export function PackBrowser({
  packs,
  onSelectPack,
  onBack,
  activePackId,
}: PackBrowserProps): React.ReactElement {
  const effectivePacks = packs ?? ALL_PACKS;

  return (
    <div
      data-testid="pack-browser-screen"
      className="min-h-screen w-full bg-wof-ink text-text-primary px-4 py-6"
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to home"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              Puzzle Packs
            </h1>
            <p className="text-sm text-text-secondary">
              {effectivePacks.length}{' '}
              {effectivePacks.length === 1 ? 'pack' : 'packs'} available
            </p>
          </div>
        </header>

        {effectivePacks.length === 0 ? (
          <p className="text-text-secondary text-center py-12">
            No puzzle packs available.
          </p>
        ) : (
          <ul className="grid gap-3" aria-label="Puzzle packs">
            {effectivePacks.map((pack) => (
              <li key={pack.id}>
                <PackCard
                  pack={pack}
                  isActive={pack.id === activePackId}
                  onSelect={() => onSelectPack(pack)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface PackCardProps {
  pack: PuzzlePack;
  isActive: boolean;
  onSelect: () => void;
}

function PackCard({
  pack,
  isActive,
  onSelect,
}: PackCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`pack-card-${pack.id}`}
      aria-label={`Select pack ${pack.name}`}
      aria-pressed={isActive}
      className={`
        group w-full text-left rounded-xl p-4
        bg-background-card ring-1
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow
        ${isActive ? 'ring-accent-yellow' : 'ring-white/10 hover:ring-white/30'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
          <BookOpen
            className={`w-5 h-5 ${
              isActive ? 'text-accent-yellow' : 'text-text-primary'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2
              className={`text-base font-bold truncate ${
                isActive ? 'text-accent-yellow' : 'text-text-primary'
              }`}
            >
              {pack.name}
            </h2>
            <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
          </div>
          {pack.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {pack.description}
            </p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-text-secondary">
            <span>
              {pack.puzzleCount.toLocaleString()}{' '}
              {pack.puzzleCount === 1 ? 'puzzle' : 'puzzles'}
            </span>
            <span>
              {pack.categories.length}{' '}
              {pack.categories.length === 1 ? 'category' : 'categories'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default PackBrowser;
