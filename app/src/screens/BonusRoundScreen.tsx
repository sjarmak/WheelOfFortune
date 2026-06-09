/**
 * Bonus Round Screen
 *
 * Drives the Bonus Round UI for the two bonus-specific turn states:
 *  - BONUS_PICKING: player picks 3 consonants + 1 vowel (on top of the
 *    already-revealed RSTLNE set). Submits via BONUS_CHOOSE_LETTERS.
 *  - BONUS_SOLVE_TIMER: countdown timer counts down dispatching BONUS_TICK
 *    every 100ms. Player enters a solve guess which dispatches
 *    BONUS_SOLVE_ATTEMPT. Timer expiry or correct solve ends the round.
 *
 * The reducer's START_ROUND for a BONUS puzzle already reveals RSTLNE and
 * adds those letters to guessedLetters — the screen should not re-dispatch.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CONSONANTS, GameState, VOWELS } from '../engine/types';
import { GameAction } from '../engine/game';
import { Board } from '../components/Board';

/**
 * RSTLNE letters are pre-revealed by the reducer on START_ROUND for BONUS
 * puzzles. Exclude them from the pickable consonant/vowel pools.
 */
const RSTLNE = ['R', 'S', 'T', 'L', 'N', 'E'] as const;
const PICKABLE_CONSONANTS = CONSONANTS.filter((c) => !RSTLNE.includes(c as typeof RSTLNE[number]));
const PICKABLE_VOWELS = VOWELS.filter((v) => !RSTLNE.includes(v as typeof RSTLNE[number]));

/** How often the bonus-round tick fires while on the solve timer. */
const BONUS_TICK_INTERVAL_MS = 100;

export interface BonusRoundScreenProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  /** Called when the player presses "Next" after the round ends. */
  onNextRound?: () => void;
}

export function BonusRoundScreen({
  gameState,
  dispatch,
  onNextRound,
}: BonusRoundScreenProps): React.ReactElement {
  const [pickedConsonants, setPickedConsonants] = useState<string[]>([]);
  const [pickedVowel, setPickedVowel] = useState<string | null>(null);
  const [solveInput, setSolveInput] = useState('');

  // Reset local picker state whenever we leave the picking phase or start a
  // brand-new round (identified by bonusPicks being cleared).
  useEffect(() => {
    if (gameState.turnState !== 'BONUS_PICKING') {
      setPickedConsonants([]);
      setPickedVowel(null);
    }
  }, [gameState.turnState]);

  // ─── Countdown timer: ticks while in BONUS_SOLVE_TIMER ───
  useEffect(() => {
    if (gameState.turnState !== 'BONUS_SOLVE_TIMER') return;

    const intervalId = setInterval(() => {
      dispatch({ type: 'BONUS_TICK', dtMs: BONUS_TICK_INTERVAL_MS });
    }, BONUS_TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [gameState.turnState, dispatch]);

  // ─── Picker handlers ───
  const toggleConsonant = useCallback((letter: string) => {
    setPickedConsonants((current) => {
      if (current.includes(letter)) {
        return current.filter((c) => c !== letter);
      }
      if (current.length >= 3) return current; // already at max
      return [...current, letter];
    });
  }, []);

  const selectVowel = useCallback((letter: string) => {
    setPickedVowel((current) => (current === letter ? null : letter));
  }, []);

  const canSubmitPicks =
    pickedConsonants.length === 3 && pickedVowel !== null;

  const submitPicks = useCallback(() => {
    if (!canSubmitPicks || !pickedVowel) return;
    dispatch({
      type: 'BONUS_CHOOSE_LETTERS',
      consonants: [
        pickedConsonants[0],
        pickedConsonants[1],
        pickedConsonants[2],
      ],
      vowel: pickedVowel,
    });
  }, [canSubmitPicks, pickedConsonants, pickedVowel, dispatch]);

  const submitSolve = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!solveInput.trim()) return;
      dispatch({ type: 'BONUS_SOLVE_ATTEMPT', phrase: solveInput });
      setSolveInput('');
    },
    [solveInput, dispatch],
  );

  // ─── Derived display values ───
  const secondsRemaining = useMemo(
    () => Math.max(0, Math.ceil(gameState.bonusTimerMs / 1000)),
    [gameState.bonusTimerMs],
  );

  const puzzle = gameState.currentPuzzle;
  if (!puzzle) {
    return (
      <div
        data-testid="bonus-screen-loading"
        className="min-h-screen w-full flex items-center justify-center bg-wof-ink text-text-primary"
      >
        Loading bonus round…
      </div>
    );
  }

  return (
    <div
      data-testid="bonus-round-screen"
      data-puzzle-phrase={puzzle.phrase}
      data-puzzle-id={puzzle.id}
      className="min-h-screen w-full bg-wof-ink text-text-primary flex flex-col"
    >
      <header className="px-4 py-3 bg-black/40 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-accent-yellow">
          BONUS ROUND
        </h1>
        <div
          data-testid="bonus-turn-state"
          className="text-sm font-mono text-text-secondary"
        >
          {gameState.turnState}
        </div>
      </header>

      <div className="w-full">
        <Board
          phrase={puzzle.phrase}
          revealedPositions={gameState.revealedPositions}
          category={puzzle.category}
          puzzleId={puzzle.id}
          isPuzzleSolved={gameState.turnState === 'ROUND_OVER'}
        />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-4 gap-4">
        {gameState.turnState === 'BONUS_PICKING' && (
          <PickerPanel
            pickedConsonants={pickedConsonants}
            pickedVowel={pickedVowel}
            onToggleConsonant={toggleConsonant}
            onSelectVowel={selectVowel}
            onSubmit={submitPicks}
            canSubmit={canSubmitPicks}
          />
        )}

        {gameState.turnState === 'BONUS_SOLVE_TIMER' && (
          <SolvePanel
            secondsRemaining={secondsRemaining}
            timerMs={gameState.bonusTimerMs}
            solveInput={solveInput}
            onSolveInputChange={setSolveInput}
            onSubmit={submitSolve}
          />
        )}

        {gameState.turnState === 'ROUND_OVER' && (
          <ResultPanel
            roundResult={gameState.roundResult}
            phrase={puzzle.phrase}
            onNextRound={onNextRound}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────── Subcomponents ───────────────────────────

interface PickerPanelProps {
  pickedConsonants: string[];
  pickedVowel: string | null;
  onToggleConsonant: (letter: string) => void;
  onSelectVowel: (letter: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

function PickerPanel({
  pickedConsonants,
  pickedVowel,
  onToggleConsonant,
  onSelectVowel,
  onSubmit,
  canSubmit,
}: PickerPanelProps): React.ReactElement {
  return (
    <section
      data-testid="bonus-picker-panel"
      className="w-full max-w-2xl flex flex-col gap-4"
    >
      <p className="text-sm text-text-secondary text-center">
        Pick 3 consonants and 1 vowel. RSTLNE are already revealed.
      </p>

      <div>
        <h2 className="text-base font-semibold mb-2">
          Consonants{' '}
          <span
            data-testid="bonus-consonants-selected-count"
            className="text-accent-yellow"
          >
            ({pickedConsonants.length}/3)
          </span>
        </h2>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {PICKABLE_CONSONANTS.map((letter) => {
            const isPicked = pickedConsonants.includes(letter);
            const isDisabled = !isPicked && pickedConsonants.length >= 3;
            return (
              <button
                key={letter}
                type="button"
                data-testid={`bonus-consonant-${letter}`}
                onClick={() => onToggleConsonant(letter)}
                disabled={isDisabled}
                aria-pressed={isPicked}
                className={`
                  py-2 rounded-lg font-bold text-lg
                  ${isPicked
                    ? 'bg-accent-yellow text-black'
                    : 'bg-white/10 text-text-primary hover:bg-white/20'}
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow
                `}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2">
          Vowel{' '}
          <span
            data-testid="bonus-vowel-selected-count"
            className="text-accent-yellow"
          >
            ({pickedVowel ? 1 : 0}/1)
          </span>
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {PICKABLE_VOWELS.map((letter) => {
            const isPicked = pickedVowel === letter;
            return (
              <button
                key={letter}
                type="button"
                data-testid={`bonus-vowel-${letter}`}
                onClick={() => onSelectVowel(letter)}
                aria-pressed={isPicked}
                className={`
                  py-2 rounded-lg font-bold text-lg
                  ${isPicked
                    ? 'bg-accent-yellow text-black'
                    : 'bg-white/10 text-text-primary hover:bg-white/20'}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow
                `}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        data-testid="bonus-submit-picks"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`
          mt-2 py-3 rounded-xl font-bold text-lg
          bg-accent-yellow text-black
          disabled:bg-white/10 disabled:text-text-secondary disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow
        `}
      >
        START SOLVE TIMER
      </button>
    </section>
  );
}

interface SolvePanelProps {
  secondsRemaining: number;
  timerMs: number;
  solveInput: string;
  onSolveInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

function SolvePanel({
  secondsRemaining,
  timerMs,
  solveInput,
  onSolveInputChange,
  onSubmit,
}: SolvePanelProps): React.ReactElement {
  return (
    <section
      data-testid="bonus-solve-panel"
      className="w-full max-w-2xl flex flex-col items-center gap-4"
    >
      <div
        data-testid="bonus-timer"
        data-timer-ms={timerMs}
        className="text-5xl font-bold text-accent-yellow font-mono tabular-nums"
        aria-live="polite"
      >
        {secondsRemaining}s
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full flex flex-col gap-3"
        data-testid="bonus-solve-form"
      >
        <input
          type="text"
          data-testid="bonus-solve-input"
          autoFocus
          value={solveInput}
          onChange={(e) => onSolveInputChange(e.target.value)}
          placeholder="TYPE ANSWER..."
          className="w-full border-2 border-white/20 bg-white/5 p-3 rounded text-xl uppercase font-bold text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-yellow"
        />
        <button
          type="submit"
          data-testid="bonus-solve-submit"
          className="py-3 rounded-xl font-bold text-lg bg-accent-yellow text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
        >
          SOLVE
        </button>
      </form>
    </section>
  );
}

interface ResultPanelProps {
  roundResult: GameState['roundResult'];
  phrase: string;
  onNextRound?: () => void;
}

function ResultPanel({
  roundResult,
  phrase,
  onNextRound,
}: ResultPanelProps): React.ReactElement {
  const didWin = roundResult === 'win';
  return (
    <section
      data-testid="bonus-result-panel"
      className="w-full max-w-2xl flex flex-col items-center gap-4"
    >
      <h2
        data-testid="bonus-result-heading"
        className={`text-3xl font-bold ${didWin ? 'text-accent-yellow' : 'text-red-400'}`}
      >
        {didWin ? 'YOU WIN!' : 'TIME UP'}
      </h2>
      <p
        data-testid="bonus-result-phrase"
        className="text-lg font-mono text-text-primary"
      >
        {phrase}
      </p>
      {onNextRound && (
        <button
          type="button"
          data-testid="bonus-next-round"
          onClick={onNextRound}
          className="py-3 px-6 rounded-xl font-bold text-lg bg-accent-yellow text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
        >
          NEXT ROUND
        </button>
      )}
    </section>
  );
}

export default BonusRoundScreen;
