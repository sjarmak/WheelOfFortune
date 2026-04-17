import React, { useEffect, useState } from 'react';
import { GameState } from '../engine/types';
import { GameAction } from '../engine/game';

/**
 * Renders a single puzzle tile (revealed or hidden). Kept as a
 * simple, test-friendly element (no framer-motion) so that
 * integration/e2e tests can read textContent deterministically.
 */
interface TossUpTileProps {
  char: string;
  revealed: boolean;
  position: number;
}

function TossUpTile({ char, revealed, position }: TossUpTileProps) {
  if (char === ' ') {
    return (
      <div
        data-testid={`tossup-tile-${position}`}
        data-tile-kind="space"
        className="w-4 h-8 sm:w-6 sm:h-12"
      />
    );
  }

  const isLetter = /[A-Z]/.test(char);
  const display = !isLetter ? char : revealed ? char : '';

  return (
    <div
      data-testid={`tossup-tile-${position}`}
      data-tile-kind={isLetter ? 'letter' : 'punctuation'}
      data-revealed={revealed ? 'true' : 'false'}
      className={`w-6 h-8 sm:w-10 sm:h-14 border border-gray-300 m-0.5 flex items-center justify-center text-base sm:text-2xl font-bold shadow-md ${
        revealed || !isLetter ? 'bg-white text-black' : 'bg-green-900 text-green-900'
      }`}
    >
      {display}
    </div>
  );
}

interface TossUpBoardProps {
  phrase: string;
  revealedPositions: number[];
}

function TossUpBoard({ phrase, revealedPositions }: TossUpBoardProps) {
  const revealedSet = new Set(revealedPositions);
  return (
    <div
      data-testid="tossup-board"
      className="flex flex-wrap justify-center max-w-full"
    >
      {phrase.toUpperCase().split('').map((char, i) => (
        <TossUpTile
          key={i}
          char={char}
          position={i}
          revealed={revealedSet.has(i)}
        />
      ))}
    </div>
  );
}

export interface TossUpScreenProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  onRoundComplete?: () => void;
}

/**
 * Screen shown during a Toss-Up round. Renders the progressively-
 * revealing puzzle board plus a Buzz button. When the player buzzes
 * in, a solve input appears. Submitting dispatches TOSS_UP_SOLVE_ATTEMPT.
 *
 * This component assumes the parent App owns the tick timer and
 * dispatches TOSS_UP_TICK on an interval while turnState is
 * TOSSUP_REVEALING.
 */
export function TossUpScreen({ gameState, dispatch, onRoundComplete }: TossUpScreenProps) {
  const [solveInput, setSolveInput] = useState('');
  const { currentPuzzle, revealedPositions, turnState, roundResult } = gameState;

  // When returning from buzzed -> revealing, clear any stale input
  useEffect(() => {
    if (turnState === 'TOSSUP_REVEALING') {
      setSolveInput('');
    }
  }, [turnState]);

  if (!currentPuzzle) {
    return <div data-testid="tossup-screen-empty">No puzzle loaded</div>;
  }

  const handleBuzz = () => {
    dispatch({ type: 'BUZZ_IN' });
  };

  const handleCancel = () => {
    dispatch({ type: 'CANCEL_TOSS_UP_ATTEMPT' });
    setSolveInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'TOSS_UP_SOLVE_ATTEMPT', phrase: solveInput });
    setSolveInput('');
  };

  const isBuzzed = turnState === 'TOSSUP_BUZZED';
  const isLockedOut = turnState === 'TOSSUP_LOCKED_OUT';
  const isRevealing = turnState === 'TOSSUP_REVEALING';

  return (
    <div
      data-testid="tossup-screen"
      data-turn-state={turnState}
      className="h-screen bg-game-bg flex flex-col items-center justify-center text-white p-4 gap-6"
    >
      <header className="text-center">
        <h1 className="text-3xl font-bold text-yellow-300">TOSS-UP</h1>
        <div data-testid="tossup-category" className="text-sm uppercase tracking-widest text-slate-300">
          {currentPuzzle.category}
        </div>
      </header>

      <TossUpBoard
        phrase={currentPuzzle.phrase}
        revealedPositions={revealedPositions}
      />

      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        {isRevealing && (
          <button
            data-testid="tossup-buzz-button"
            type="button"
            onClick={handleBuzz}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-full text-xl font-bold shadow-lg uppercase tracking-wider"
          >
            Buzz In
          </button>
        )}

        {isBuzzed && (
          <form
            data-testid="tossup-solve-form"
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-3 bg-white text-black rounded-xl p-4"
          >
            <label htmlFor="tossup-solve-input" className="text-sm font-bold">
              Solve the puzzle:
            </label>
            <input
              id="tossup-solve-input"
              data-testid="tossup-solve-input"
              autoFocus
              value={solveInput}
              onChange={(e) => setSolveInput(e.target.value)}
              className="w-full border-2 border-slate-300 p-3 rounded text-xl uppercase font-bold"
              placeholder="TYPE ANSWER..."
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                data-testid="tossup-cancel-button"
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="tossup-submit-button"
                className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
              >
                Solve
              </button>
            </div>
          </form>
        )}

        {isLockedOut && (
          <div data-testid="tossup-locked-out" className="flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-red-400">Locked Out</div>
            <p className="text-sm text-slate-300 text-center">
              Incorrect answer — you lose this toss-up.
            </p>
            {onRoundComplete && (
              <button
                type="button"
                data-testid="tossup-next-round-button"
                onClick={onRoundComplete}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-bold"
              >
                Next Round
              </button>
            )}
          </div>
        )}

        {roundResult === 'WIN' && turnState === 'ROUND_OVER' && (
          <div data-testid="tossup-win" className="text-2xl font-bold text-green-400">
            Correct!
          </div>
        )}
      </div>
    </div>
  );
}

export default TossUpScreen;
