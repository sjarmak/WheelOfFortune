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
    expect(state.turnState).toBe('GUESSING_CONSONANT'); // Should stay in GUESSING_CONSONANT
    expect(state.spinResult).toBe(500); // Should keep spin value
    expect(state.player.currentRoundScore).toBe(500); // 1 H × $500
    expect(state.revealedPositions).toContain(0); // H at position 0

    // Guess another consonant that IS in phrase (L) - appears 3 times at positions 2, 3, 9
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'L', cost: 0 });
    expect(state.turnState).toBe('GUESSING_CONSONANT');
    expect(state.spinResult).toBe(500); // Still have spin value
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

  it('should allow buying vowel while in GUESSING_CONSONANT', () => {
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
    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Buy vowel from GUESSING_CONSONANT state
    state = gameReducer(state, { type: 'BUY_VOWEL' });
    expect(state.turnState).toBe('BUYING_VOWEL');
    expect(state.spinResult).toBe(500); // Keep spin value

    // Guess vowel A (appears 1 time at position 4 in "HELLO")
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'A', cost: 250 });
    // A is NOT in "HELLO WORLD", so the reducer should track that count === 0
    // But actually, A is not in the phrase, so it should transition to IDLE (wrong guess)
    expect(state.turnState).toBe('IDLE'); // Wrong vowel, turn ends
    expect(state.spinResult).toBe(500);
    expect(state.player.currentRoundScore).toBe(250); // 500 - 250 (vowel cost)
  });

  it('should handle FREE_PLAY without losing turn on missed letter', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle, seed: 42 });

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: { id: '12', type: 'FREE_PLAY', value: 500, label: 'FREE PLAY', color: '#999' }
    });
    expect(state.player.freePlay).toBe(true);
    expect(state.turnState).toBe('GUESSING_CONSONANT');

    // Guess letter not in phrase - should stay in turn with FREE_PLAY
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'B', cost: 0 });
    expect(state.turnState).toBe('GUESSING_CONSONANT'); // Stay in turn
    expect(state.player.currentRoundScore).toBe(0); // No money for missing
  });
});
