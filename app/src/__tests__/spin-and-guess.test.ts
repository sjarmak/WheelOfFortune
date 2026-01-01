import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from '../engine/game';
import { Puzzle, WHEEL_CONFIG } from '../engine/types';

describe('Spin and Guess Flow', () => {
  const testPuzzle: Puzzle = {
    id: 'test',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  it('should transition from IDLE -> SPINNING -> GUESSING_CONSONANT after spinning cash', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: testPuzzle });
    expect(state.turnState).toBe('IDLE');

    // Start spin
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    expect(state.turnState).toBe('SPINNING');
    expect(state.canSpin).toBeUndefined(); // No canSpin in state

    // Spin completes with cash
    const cashWedge = WHEEL_CONFIG.find(w => w.type === 'CASH');
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge! });
    expect(state.turnState).toBe('GUESSING_CONSONANT');
    expect(state.spinResult).toBe(cashWedge!.value);
  });

  it('should transition to IDLE after BANKRUPT', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: testPuzzle });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const bankruptWedge = WHEEL_CONFIG.find(w => w.type === 'BANKRUPT');
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: bankruptWedge! });

    expect(state.turnState).toBe('IDLE');
    expect(state.player.currentRoundScore).toBe(0);
  });

  it('should allow guessing after landing on cash', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: testPuzzle });

    // Spin and land on $500
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = WHEEL_CONFIG.find(w => w.type === 'CASH' && w.value === 500)!;
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge });

    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Guess consonant 'H' - appears 1 time in "HELLO WORLD"
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'H', cost: 0 });

    expect(state.guessedLetters).toContain('H');
    expect(state.revealedPositions).toContain(0); // H is at position 0
    expect(state.player.currentRoundScore).toBe(500); // 1 * 500
    expect(state.turnState).toBe('GUESSING_CONSONANT'); // Stay in GUESSING_CONSONANT to continue guessing or buy vowel
    expect(state.spinResult).toBe(500); // Keep the spin value
  });

  it('should handle FREE_PLAY flag', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: testPuzzle });

    // Spin and land on FREE_PLAY
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const freePlayWedge = WHEEL_CONFIG.find(w => w.type === 'FREE_PLAY')!;
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: freePlayWedge });

    expect(state.player.freePlay).toBe(true);
    expect(state.spinResult).toBe(freePlayWedge.value);
  });
});
