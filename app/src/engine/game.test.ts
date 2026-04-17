import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from './game';
import { Puzzle } from './types';

describe('Game Reducer - Turn Flow', () => {
  const puzzle: Puzzle = {
    id: '1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  it('should allow multiple letter guesses after spinning without re-spinning', () => {
    // Start round
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle, seed: 42 });
    expect(state.turnState).toBe('IDLE');
    expect(state.currentPuzzle).toEqual(puzzle);

    // Spin wheel
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    expect(state.turnState).toBe('SPINNING');

    // Get spin result (cash value)
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: { id: '1', type: 'CASH', value: 500, label: '$500', color: '#999' }
    });
    expect(state.turnState).toBe('GUESSING_CONSONANT');
    expect(state.spinResult).toBe(500);

    // Guess consonant that IS in phrase (H) - appears once at position 0
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'H', cost: 0 });
    expect(state.turnState).toBe('IDLE'); // Return to choice state
    expect(state.spinResult).toBe(500); // Keep spin value
    expect(state.player.currentRoundScore).toBe(500); // 1 H × $500
    expect(state.revealedPositions).toContain(0); // H at position 0

    // From IDLE, can spin again, buy vowel, solve, or choose to guess another consonant
    // For this test, let's simulate spinning again and guessing another consonant
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: { id: '1', type: 'CASH', value: 500, label: '$500', color: '#999' }
    });

    // Guess another consonant that IS in phrase (L) - appears 3 times at positions 2, 3, 9
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'L', cost: 0 });
    expect(state.turnState).toBe('IDLE'); // Back to choice state
    expect(state.spinResult).toBe(500); // Keep spin value
    expect(state.player.currentRoundScore).toBe(2000); // 500 + (3 L's × $500)
    expect(state.revealedPositions).toContain(2); // First L
    expect(state.revealedPositions).toContain(3); // Second L
    expect(state.revealedPositions).toContain(9); // Third L

    // Guess consonant that is NOT in phrase (B) - should end turn
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'B', cost: 0 });
    expect(state.turnState).toBe('IDLE'); // Turn ends
    expect(state.spinResult).toBe(500); // Keep spin value even after losing
    expect(state.player.currentRoundScore).toBe(2000); // Score unchanged
  });

  it('should allow buying vowel from IDLE after guessing consonant', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle, seed: 42 });

    // Spin and get cash ($500)
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: { id: '1', type: 'CASH', value: 500, label: '$500', color: '#999' }
    });
    expect(state.turnState).toBe('GUESSING_CONSONANT');
    expect(state.spinResult).toBe(500);

    // Guess consonant H to build score ($500 × 1)
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'H', cost: 0 });
    expect(state.player.currentRoundScore).toBe(500);
    expect(state.turnState).toBe('IDLE'); // Back to choice state

    // Buy vowel from IDLE state
    state = gameReducer(state, { type: 'BUY_VOWEL' });
    expect(state.turnState).toBe('BUYING_VOWEL');
    expect(state.spinResult).toBe(500); // Keep spin value

    // Guess vowel A (NOT in "HELLO WORLD")
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'A', cost: 250 });
    expect(state.turnState).toBe('IDLE'); // Return to choice state after vowel guess
    expect(state.spinResult).toBe(500);
    expect(state.player.currentRoundScore).toBe(250); // 500 - 250 (vowel cost)
  });

  it('should return to IDLE even with FREE_PLAY on missed letter', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle, seed: 42 });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: { id: '12', type: 'FREE_PLAY', value: 500, label: 'FREE PLAY', color: '#999' }
    });
    expect(state.player.freePlay).toBe(true);
    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Guess letter not in phrase - still goes to IDLE (but in real game, FREE_PLAY might have different rules)
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'B', cost: 0 });
    expect(state.turnState).toBe('IDLE'); // Returns to choice state
    expect(state.player.freePlay).toBe(true); // But free play status stays
    expect(state.player.currentRoundScore).toBe(0); // No money for missing
  });
});
