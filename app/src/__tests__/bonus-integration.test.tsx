/**
 * Bonus Round integration test.
 *
 * Drives the full BonusRoundScreen end-to-end:
 *  1. Mount with a BONUS puzzle already started (via the real reducer).
 *  2. Verify RSTLNE letters are pre-revealed in state AND on-screen via the Board.
 *  3. Pick 3 consonants + 1 vowel through the picker UI — this should dispatch
 *     BONUS_CHOOSE_LETTERS through the real reducer and move to BONUS_SOLVE_TIMER.
 *  4. Assert the countdown timer ticks (driven by BONUS_TICK on an interval).
 *  5. Submit the correct solve phrase via the form — should transition to
 *     ROUND_OVER with roundResult = 'win'.
 *
 * Uses the REAL reducer (no mocks); only timers are faked so we can advance
 * the BONUS_TICK interval deterministically.
 */

import React, { useReducer } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { gameReducer, INITIAL_STATE } from '../engine/game';
import { Puzzle } from '../engine/types';
import { BonusRoundScreen } from '../screens/BonusRoundScreen';

const bonusPuzzle: Puzzle = {
  id: 'bonus-test-1',
  phrase: 'HELLO WORLD',
  category: 'PHRASE',
  round_type: 'BONUS',
};

function Harness() {
  const [state, dispatch] = useReducer(
    gameReducer,
    INITIAL_STATE,
    (initial) =>
      gameReducer(initial, { type: 'START_ROUND', puzzle: bonusPuzzle, seed: 1 }),
  );

  return (
    <>
      <div data-testid="harness-turn-state">{state.turnState}</div>
      <div data-testid="harness-round-result">{state.roundResult ?? 'null'}</div>
      <div data-testid="harness-timer-ms">{state.bonusTimerMs}</div>
      <div data-testid="harness-guessed-letters">
        {state.guessedLetters.join(',')}
      </div>
      <div data-testid="harness-revealed-count">
        {state.revealedPositions.length}
      </div>
      <BonusRoundScreen gameState={state} dispatch={dispatch} />
    </>
  );
}

describe('Bonus Round integration (RSTLNE -> pick -> timer -> solve)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('drives the full bonus flow from RSTLNE reveal through win', () => {
    render(<Harness />);

    // ── 1. Reducer has placed us in BONUS_PICKING and revealed RSTLNE ──
    expect(screen.getByTestId('harness-turn-state').textContent).toBe(
      'BONUS_PICKING',
    );
    expect(screen.getByTestId('harness-guessed-letters').textContent).toBe(
      'R,S,T,L,N,E',
    );

    // HELLO WORLD has letters at indices 0-4 and 6-10. RSTLNE matches
    // positions for L, L, O (wait — O isn't in RSTLNE), R, L, D (D isn't).
    // Actually phrase "HELLO WORLD" uppercased letter-by-letter:
    //   H(0) E(1) L(2) L(3) O(4)   W(6) O(7) R(8) L(9) D(10)
    // RSTLNE hits: E(1), L(2), L(3), R(8), L(9) => 5 positions
    expect(screen.getByTestId('harness-revealed-count').textContent).toBe('5');

    // The bonus screen is visible
    expect(screen.getByTestId('bonus-round-screen')).toBeInTheDocument();
    expect(screen.getByTestId('bonus-picker-panel')).toBeInTheDocument();

    // ── 2. Pick 3 consonants (H, W, D — from the HELLO WORLD phrase) ──
    fireEvent.click(screen.getByTestId('bonus-consonant-H'));
    fireEvent.click(screen.getByTestId('bonus-consonant-W'));
    fireEvent.click(screen.getByTestId('bonus-consonant-D'));
    expect(
      screen.getByTestId('bonus-consonants-selected-count').textContent,
    ).toBe('(3/3)');

    // ── 3. Pick 1 vowel (O) ──
    fireEvent.click(screen.getByTestId('bonus-vowel-O'));
    expect(
      screen.getByTestId('bonus-vowel-selected-count').textContent,
    ).toBe('(1/1)');

    // ── 4. Submit picks — dispatches BONUS_CHOOSE_LETTERS ──
    fireEvent.click(screen.getByTestId('bonus-submit-picks'));

    expect(screen.getByTestId('harness-turn-state').textContent).toBe(
      'BONUS_SOLVE_TIMER',
    );
    // All HELLO WORLD letter positions should now be revealed (phrase has 10 letters,
    // space at index 5 is not counted).
    expect(screen.getByTestId('harness-revealed-count').textContent).toBe('10');

    // ── 5. Timer is visible and starts at 20000 ms (INITIAL_STATE default) ──
    const initialTimerMs = Number(
      screen.getByTestId('harness-timer-ms').textContent,
    );
    expect(initialTimerMs).toBe(20000);
    expect(screen.getByTestId('bonus-timer')).toBeInTheDocument();

    // ── 6. Advance fake timers — BONUS_TICK should fire repeatedly ──
    act(() => {
      vi.advanceTimersByTime(500); // 5 ticks of 100ms
    });
    const afterTickTimerMs = Number(
      screen.getByTestId('harness-timer-ms').textContent,
    );
    expect(afterTickTimerMs).toBeLessThan(initialTimerMs);
    expect(afterTickTimerMs).toBeGreaterThanOrEqual(initialTimerMs - 600);

    // ── 7. Submit correct solve — moves to ROUND_OVER with win ──
    const input = screen.getByTestId(
      'bonus-solve-input',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'HELLO WORLD' } });
    fireEvent.submit(screen.getByTestId('bonus-solve-form'));

    expect(screen.getByTestId('harness-turn-state').textContent).toBe(
      'ROUND_OVER',
    );
    expect(screen.getByTestId('harness-round-result').textContent).toBe('win');
    expect(screen.getByTestId('bonus-result-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bonus-result-heading').textContent).toBe(
      'YOU WIN!',
    );
  });

  it('expires the timer into ROUND_OVER/loss when no solve is attempted', () => {
    render(<Harness />);

    // Move to BONUS_SOLVE_TIMER by picking 3 consonants + 1 vowel.
    fireEvent.click(screen.getByTestId('bonus-consonant-H'));
    fireEvent.click(screen.getByTestId('bonus-consonant-W'));
    fireEvent.click(screen.getByTestId('bonus-consonant-D'));
    fireEvent.click(screen.getByTestId('bonus-vowel-O'));
    fireEvent.click(screen.getByTestId('bonus-submit-picks'));

    expect(screen.getByTestId('harness-turn-state').textContent).toBe(
      'BONUS_SOLVE_TIMER',
    );

    // Advance past the 20-second timer duration.
    act(() => {
      vi.advanceTimersByTime(21_000);
    });

    expect(screen.getByTestId('harness-turn-state').textContent).toBe(
      'ROUND_OVER',
    );
    expect(screen.getByTestId('harness-round-result').textContent).toBe(
      'loss',
    );
  });
});
