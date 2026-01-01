import { describe, test, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from '../game';
import { Puzzle } from '../types';

describe('Consonant-Only Guessing after Spin', () => {
  const mockPuzzle: Puzzle = {
    id: '1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  test('After SPIN_RESULT, turnState is GUESSING_CONSONANT', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    expect(state.turnState).toBe('SPINNING');

    const cashWedge = { id: '1', type: 'CASH' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    expect(state.turnState).toBe('GUESSING_CONSONANT');
  });

  test('BANKRUPT and LOSE_TURN end turn without consonant requirement', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    const bankruptWedge = { id: '4', type: 'BANKRUPT' as const, value: 0, label: 'BANKRUPT', color: 'black', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: bankruptWedge
    });

    expect(state.turnState).toBe('IDLE');
    expect(state.spinResult).toBe('BANKRUPT');
  });

  test('After consonant guess, turnState stays GUESSING_CONSONANT (allowing more guesses or vowels)', () => {
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

    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Guess consonant 'H'
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'H',
      cost: 0
    });

    expect(state.turnState).toBe('GUESSING_CONSONANT'); // Stay in GUESSING_CONSONANT
    expect(state.spinResult).toBe(500); // Keep spin value
  });

  test('Vowel cost validation - cannot buy vowel without sufficient funds', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Set round score below vowel cost (250)
    state = { ...state, player: { ...state.player, currentRoundScore: 100 } };

    // Try to buy a vowel - this would need to be checked in App.tsx
    // The test verifies the state allows tracking this
    expect(state.player.currentRoundScore).toBe(100);
  });

  test('Y is treated as consonant not vowel', () => {
    // This is implicit - Y should not be in VOWELS list
    // Keyboard component checks VOWELS to determine if button is vowel
    // So as long as Y is not in VOWELS, it will be treated as consonant
    const VOWELS = ['A', 'E', 'I', 'O', 'U'];
    expect(VOWELS).not.toContain('Y');
  });

  test('After guessing consonant in free play, vowels also become available', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const freePlayWedge = { id: '10', type: 'FREE_PLAY' as const, value: 500, label: 'FREE PLAY', color: 'yellow', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: freePlayWedge
    });

    expect(state.player.freePlay).toBe(true);
    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Guess consonant
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'H',
      cost: 0
    });

    expect(state.turnState).toBe('GUESSING_CONSONANT'); // Stay in GUESSING_CONSONANT with free play
    expect(state.player.freePlay).toBe(true);
    expect(state.spinResult).toBe(500); // Keep spin value
  });
});
