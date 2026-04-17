import { describe, test, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from '../game';
import { Puzzle } from '../types';

describe('BANKRUPT and LOSE_TURN Handling', () => {
  const mockPuzzle: Puzzle = {
    id: '1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  test('BANKRUPT clears currentRoundScore but preserves totalScore', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Simulate earning points in previous rounds
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 2500, totalScore: 5000 }
    };

    const bankruptWedge = { id: '4', type: 'BANKRUPT' as const, value: 0, label: 'BANKRUPT', color: 'black', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: bankruptWedge
    });

    expect(state.player.currentRoundScore).toBe(0); // Cleared
    expect(state.player.totalScore).toBe(5000); // Preserved
    expect(state.spinResult).toBe('BANKRUPT');
  });

  test('LOSE_TURN preserves currentRoundScore and ends turn', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 1500, totalScore: 3000 }
    };

    const loseTurnWedge = { id: '7', type: 'LOSE_TURN' as const, value: 0, label: 'LOSE TURN', color: 'gray', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: loseTurnWedge
    });

    expect(state.player.currentRoundScore).toBe(1500); // Preserved
    expect(state.player.totalScore).toBe(3000); // Preserved
    expect(state.spinResult).toBe('LOSE_TURN');
    expect(state.turnState).toBe('IDLE'); // Turn ended
  });

  test('BANKRUPT after earning money shows correct loss', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Spin $500, guess 'L' (appears 3 times = 1500 points)
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'VALUE' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    expect(state.player.currentRoundScore).toBe(1500);
    expect(state.player.totalScore).toBe(0);

    // Now spin BANKRUPT
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const bankruptWedge = { id: '4', type: 'BANKRUPT' as const, value: 0, label: 'BANKRUPT', color: 'black', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: bankruptWedge
    });

    expect(state.player.currentRoundScore).toBe(0); // Lost the 1500
    expect(state.player.totalScore).toBe(0); // Total not affected
  });

  test('Spinning LOSE_TURN after earning money preserves points for next turn', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Earn 2000 points
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'VALUE' as const, value: 500, label: '$500', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    expect(state.player.currentRoundScore).toBe(1500);

    // Spin LOSE_TURN
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const loseTurnWedge = { id: '7', type: 'LOSE_TURN' as const, value: 0, label: 'LOSE TURN', color: 'gray', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: loseTurnWedge
    });

    // Points stay the same for next player to potentially steal from
    expect(state.player.currentRoundScore).toBe(1500);
  });

  test('Multiple BANKRUPTs in same round each clear the score', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Spin $600
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const cashWedge = { id: '1', type: 'VALUE' as const, value: 600, label: '$600', color: 'red', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: cashWedge
    });

    // Guess 'L' (appears 3 times = 1800 points)
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'L',
      cost: 0
    });

    const scoreAfterFirst = state.player.currentRoundScore;
    expect(scoreAfterFirst).toBe(1800);

    // Spin and hit BANKRUPT
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    const bankruptWedge = { id: '4', type: 'BANKRUPT' as const, value: 0, label: 'BANKRUPT', color: 'black', weight: 1 };
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: bankruptWedge
    });

    expect(state.player.currentRoundScore).toBe(0); // Lost 1800

    // Add points again
    state = gameReducer(state, {
      type: 'ADD_TO_ROUND_SCORE',
      points: 800
    });

    expect(state.player.currentRoundScore).toBe(800);

    // Second BANKRUPT
    state = gameReducer(state, {
      type: 'SPIN_RESULT',
      wedge: bankruptWedge
    });

    expect(state.player.currentRoundScore).toBe(0);
    expect(state.player.totalScore).toBe(0); // Never added to total
  });

  test('CLEAR_ROUND_SCORE action works independently', () => {
    let state = {
      ...INITIAL_STATE,
      player: { ...INITIAL_STATE.player, currentRoundScore: 3000, totalScore: 5000 }
    };

    state = gameReducer(state, {
      type: 'CLEAR_ROUND_SCORE'
    });

    expect(state.player.currentRoundScore).toBe(0);
    expect(state.player.totalScore).toBe(5000);
  });
});
