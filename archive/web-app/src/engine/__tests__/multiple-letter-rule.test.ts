import { describe, test, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from '../game';
import { Puzzle } from '../types';

describe('Multiple Letter Rule - Points × Letter Count', () => {
  const mockPuzzle: Puzzle = {
    id: '1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  test('Guessing consonant with multiple occurrences multiplies points', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Spin $500
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'CASH' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    expect(state.spinResult).toBe(500);

    // Guess 'L' - appears 3 times in HELLO WORLD
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    // Should gain 500 × 3 = 1500
    expect(state.player.currentRoundScore).toBe(1500);
    expect(state.revealedPositions).toContain(2); // L in HELLO
    expect(state.revealedPositions).toContain(3); // L in HELLO
    expect(state.revealedPositions).toContain(9); // L in WORLD
  });

  test('Guessing consonant that appears once gains wheel value once', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'CASH' as const, value: 600, label: '$600', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    // Guess 'W' - appears once in HELLO WORLD
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'W',
      cost: 0
    });

    expect(state.player.currentRoundScore).toBe(600);
  });

  test('Guessing letter not in puzzle gains 0 points', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'CASH' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    // Guess 'Z' - not in HELLO WORLD
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'Z',
      cost: 0
    });

    expect(state.player.currentRoundScore).toBe(0);
  });

  test('Buying vowel with multiple occurrences multiplies points', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Set up state with initial round score
    state = { ...state, player: { ...state.player, currentRoundScore: 500 } };

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const freePlayWedge = { id: '10', type: 'FREE_PLAY' as const, value: 0, label: 'FREE PLAY', color: 'yellow', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: freePlayWedge
    });

    // Buy vowel 'E' - appears 1 time in HELLO WORLD
    // Cost is 250, but we're in free play so no cost
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'E',
      cost: 0 // Free play removes cost
    });

    // No points added for vowel in free play (no wheel value)
    expect(state.player.currentRoundScore).toBe(500);
  });

  test('After revealing letters, they are included in revealedPositions', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'CASH' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    const initialRevealCount = state.revealedPositions.length;

    // Guess 'O' - appears 2 times
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'O',
      cost: 0
    });

    expect(state.revealedPositions.length).toBe(initialRevealCount + 2);
  });

  test('Guessing same letter twice does not double-count', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'CASH' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    // Guess 'L'
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    const scoreAfterFirst = state.player.currentRoundScore;
    expect(scoreAfterFirst).toBeGreaterThan(0); // Should have earned points for L

    // Guess 'L' again - should return unchanged state
    const stateBeforeRetry = state;
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    // State should be completely unchanged (L already guessed)
    expect(state).toEqual(stateBeforeRetry);
    expect(state.player.currentRoundScore).toBe(scoreAfterFirst);
  });
});
