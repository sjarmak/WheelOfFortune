import { describe, it, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from './game';
import { Puzzle } from './types';

describe('Game Engine', () => {
  const TEST_PUZZLE: Puzzle = {
    id: 'test-1',
    phrase: 'TEST PUZZLE',
    category: 'TEST',
    round_type: 'MAIN'
  };

  it('starts a round correctly', () => {
    const newState = gameReducer(INITIAL_STATE, { 
      type: 'START_ROUND', 
      puzzle: TEST_PUZZLE,
      seed: 12345 
    });

    expect(newState.currentPuzzle).toBe(TEST_PUZZLE);
    expect(newState.turnState).toBe('IDLE');
    expect(newState.player.currentRoundScore).toBe(0);
  });

  it('handles spin result', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'SPIN_WHEEL' });
    expect(state.turnState).toBe('SPINNING');

    state = gameReducer(state, { 
      type: 'SPIN_RESULT', 
      wedge: { id: '1', type: 'CASH', value: 1000, label: '$1000', color: 'red', weight: 1 } 
    });
    
    expect(state.turnState).toBe('GUESSING_CONSONANT');
    expect(state.spinResult).toBe(1000);
  });

  it('handles correct consonant guess', () => {
    // Setup state where we spun 1000
    let state = gameReducer(INITIAL_STATE, { 
      type: 'START_ROUND', 
      puzzle: TEST_PUZZLE 
    });
    state = { ...state, spinResult: 1000, turnState: 'GUESSING_CONSONANT' };

    // Guess 'T' (appears twice in TEST PUZZLE)
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'T', cost: 0 });

    expect(state.guessedLetters).toContain('T');
    expect(state.player.currentRoundScore).toBe(2000); // 1000 * 2
    expect(state.turnState).toBe('IDLE');
  });

  it('handles bankrupt', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: TEST_PUZZLE });
    state = { ...state, player: { ...state.player, currentRoundScore: 5000 } };

    state = gameReducer(state, { 
      type: 'SPIN_RESULT', 
      wedge: { id: 'x', type: 'BANKRUPT', value: 0, label: 'BANKRUPT', color: 'black', weight: 1 } 
    });

    expect(state.player.currentRoundScore).toBe(0);
    // expect(state.turnState).toBe('IDLE'); // Logic in reducer sets it to IDLE
  });
});
