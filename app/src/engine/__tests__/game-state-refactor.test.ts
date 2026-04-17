import { gameReducer, INITIAL_STATE } from '../game';
import { GameState, Puzzle } from '../types';

describe('GameState Refactor - Round vs Total Scores', () => {
  const mockPuzzle: Puzzle = {
    id: '1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  test('INITIAL_STATE has player with currentRoundScore and totalScore', () => {
    expect(INITIAL_STATE.player).toBeDefined();
    expect(INITIAL_STATE.player.currentRoundScore).toBe(0);
    expect(INITIAL_STATE.player.totalScore).toBe(0);
  });

  test('START_ROUND resets currentRoundScore to 0 but keeps totalScore', () => {
    // First round - earn 1000 points
    const afterFirstRound = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });
    
    // Simulate adding points to round score
    let state = {
      ...afterFirstRound,
      player: { ...afterFirstRound.player, currentRoundScore: 1000, totalScore: 1000 }
    };

    // Start new round - currentRoundScore should reset, totalScore stays
    const afterSecondRound = gameReducer(state, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    expect(afterSecondRound.player.currentRoundScore).toBe(0);
    expect(afterSecondRound.player.totalScore).toBe(1000);
  });

  test('ADD_TO_ROUND_SCORE adds to currentRoundScore, SOLVE_ATTEMPT adds to totalScore', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Add points to round
    state = gameReducer(state, {
      type: 'ADD_TO_ROUND_SCORE',
      points: 500
    });

    expect(state.player.currentRoundScore).toBe(500);
    expect(state.player.totalScore).toBe(0);

    // Add more points
    state = gameReducer(state, {
      type: 'ADD_TO_ROUND_SCORE',
      points: 300
    });

    expect(state.player.currentRoundScore).toBe(800);
    expect(state.player.totalScore).toBe(0);
  });

  test('CLEAR_ROUND_SCORE zeros currentRoundScore but preserves totalScore', () => {
    let state = {
      ...INITIAL_STATE,
      player: { currentRoundScore: 1500, totalScore: 5000 }
    };

    const afterBankrupt = gameReducer(state, {
      type: 'CLEAR_ROUND_SCORE'
    });

    expect(afterBankrupt.player.currentRoundScore).toBe(0);
    expect(afterBankrupt.player.totalScore).toBe(5000); // Not affected
  });

  test('SOLVE_ATTEMPT with correct answer updates totalScore', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    // Add points to round
    state = gameReducer(state, {
      type: 'ADD_TO_ROUND_SCORE',
      points: 2000
    });

    // Solve correctly
    state = gameReducer(state, {
      type: 'SOLVE_ATTEMPT',
      phrase: 'HELLO WORLD'
    });

    expect(state.player.totalScore).toBe(2000);
    expect(state.turnState).toBe('ROUND_OVER');
  });

  test('SOLVE_ATTEMPT with incorrect answer does not change scores', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mockPuzzle
    });

    state = gameReducer(state, {
      type: 'ADD_TO_ROUND_SCORE',
      points: 2000
    });

    const before = { ...state.player };

    state = gameReducer(state, {
      type: 'SOLVE_ATTEMPT',
      phrase: 'WRONG ANSWER'
    });

    expect(state.player.currentRoundScore).toBe(before.currentRoundScore);
    expect(state.player.totalScore).toBe(before.totalScore);
  });
});
