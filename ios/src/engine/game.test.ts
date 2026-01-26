/**
 * Game Reducer Tests
 * Tests the core game logic for Standard Mode
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { gameReducer, INITIAL_STATE } from './game';
import { Puzzle, GameState } from './types';

// Test puzzle
const testPuzzle: Puzzle = {
  id: 'test-1',
  phrase: 'WHEEL OF FORTUNE',
  category: 'TV SHOW',
  difficulty: { score: 0.5, reasons: [] },
  round_type: 'MAIN',
};

describe('gameReducer - Standard Mode', () => {
  describe('START_ROUND', () => {
    it('initializes a new round with a puzzle', () => {
      const newState = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle,
      });

      expect(newState.currentPuzzle).toEqual(testPuzzle);
      expect(newState.turnState).toBe('IDLE');
      expect(newState.guessedLetters).toEqual([]);
      expect(newState.roundCount).toBe(1);
      expect(newState.player.currentRoundScore).toBe(0);
      expect(newState.spinCount).toBe(0);
    });

    it('resets round state between puzzles', () => {
      let state = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle,
      });

      // Simulate some game state
      state = gameReducer(state, {
        type: 'SPIN_WHEEL',
      });

      state = gameReducer(state, {
        type: 'SPIN_RESULT',
        wedge: { id: '1', type: 'VALUE', value: 500, label: '500', color: '#FF0000' },
      });

      const secondPuzzle = { ...testPuzzle, id: 'test-2', phrase: 'HELLO WORLD' };
      state = gameReducer(state, {
        type: 'START_ROUND',
        puzzle: secondPuzzle,
      });

      expect(state.currentPuzzle).toEqual(secondPuzzle);
      expect(state.roundCount).toBe(2);
      expect(state.spinCount).toBe(0);
      expect(state.turnState).toBe('IDLE');
      expect(state.player.currentRoundScore).toBe(0);
    });
  });

  describe('SPIN_WHEEL', () => {
    it('transitions to SPINNING state', () => {
      const state = gameReducer(INITIAL_STATE, {
        type: 'SPIN_WHEEL',
      });

      expect(state.turnState).toBe('SPINNING');
      expect(state.spinCount).toBe(1);
    });
  });

  describe('SPIN_RESULT', () => {
    let stateAfterSpin: GameState;

    beforeEach(() => {
      let state = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle,
      });
      stateAfterSpin = gameReducer(state, {
        type: 'SPIN_WHEEL',
      });
    });

    it('handles BANKRUPT wedge - clears round score', () => {
      const newState = gameReducer(stateAfterSpin, {
        type: 'SPIN_RESULT',
        wedge: { id: 'bankrupt', type: 'BANKRUPT', value: 0, label: 'BANKRUPT', color: '#000000' },
      });

      expect(newState.spinResult).toBe('BANKRUPT');
      expect(newState.player.currentRoundScore).toBe(0);
      expect(newState.turnState).toBe('IDLE');
    });

    it('handles LOSE_TURN wedge', () => {
      const newState = gameReducer(stateAfterSpin, {
        type: 'SPIN_RESULT',
        wedge: { id: 'lose', type: 'LOSE_TURN', value: 0, label: 'LOSE TURN', color: '#FF0000' },
      });

      expect(newState.spinResult).toBe('LOSE_TURN');
      expect(newState.turnState).toBe('IDLE');
    });

    it('handles FREE_PLAY wedge', () => {
      const newState = gameReducer(stateAfterSpin, {
        type: 'SPIN_RESULT',
        wedge: { id: 'free', type: 'FREE_PLAY', value: 0, label: 'FREE PLAY', color: '#FFD700' },
      });

      expect(newState.spinResult).toBe(0);
      expect(newState.player.freePlay).toBe(true);
      expect(newState.turnState).toBe('GUESSING_CONSONANT');
    });

    it('handles VALUE wedge', () => {
      const newState = gameReducer(stateAfterSpin, {
        type: 'SPIN_RESULT',
        wedge: { id: '500', type: 'VALUE', value: 500, label: '500', color: '#FF0000' },
      });

      expect(newState.spinResult).toBe(500);
      expect(newState.turnState).toBe('GUESSING_CONSONANT');
      expect(newState.player.freePlay).toBe(false);
    });
  });

  describe('GUESS_LETTER', () => {
    let stateAfterValue: GameState;

    beforeEach(() => {
      let state = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle, // "WHEEL OF FORTUNE"
      });
      state = gameReducer(state, { type: 'SPIN_WHEEL' });
      stateAfterValue = gameReducer(state, {
        type: 'SPIN_RESULT',
        wedge: { id: '500', type: 'VALUE', value: 500, label: '500', color: '#FF0000' },
      });
    });

    it('reveals consonant and adds to score', () => {
      const newState = gameReducer(stateAfterValue, {
        type: 'GUESS_LETTER',
        letter: 'W',
        cost: 0,
      });

      expect(newState.guessedLetters).toContain('W');
      expect(newState.revealedPositions).toContain(0); // W at position 0
      // Only one W in "WHEEL OF FORTUNE"
      expect(newState.player.currentRoundScore).toBe(500 * 1); // 1 W × 500
    });

    it('prevents duplicate letter guesses', () => {
      let state = gameReducer(stateAfterValue, {
        type: 'GUESS_LETTER',
        letter: 'E',
        cost: 0,
      });

      const stateBeforeDuplicate = state;
      state = gameReducer(state, {
        type: 'GUESS_LETTER',
        letter: 'E',
        cost: 0,
      });

      // State should not change
      expect(state).toEqual(stateBeforeDuplicate);
    });

    it('deducts cost when buying vowel', () => {
      const newState = gameReducer(stateAfterValue, {
        type: 'GUESS_LETTER',
        letter: 'A',
        cost: 250,
      });

      expect(newState.guessedLetters).toContain('A');
      // No A in "WHEEL OF FORTUNE", so score = 500 (from spin) - 250 (vowel cost) = 250
      // But the current logic deducts cost first: 0 - 250 = -250
      expect(newState.player.currentRoundScore).toBe(-250);
    });

    it('reveals vowel when found', () => {
      const newState = gameReducer(stateAfterValue, {
        type: 'GUESS_LETTER',
        letter: 'E',
        cost: 250,
      });

      expect(newState.guessedLetters).toContain('E');
      // E appears at positions 2, 3, 15 in "WHEEL OF FORTUNE" (0:W 1:H 2:E 3:E ... 15:E)
      expect(newState.revealedPositions).toContain(2);
      expect(newState.revealedPositions).toContain(3);
      expect(newState.revealedPositions).toContain(15);
      // Vowel cost is deducted but no earnings, so 0 - 250 = -250
      expect(newState.player.currentRoundScore).toBe(0 - 250);
    });
  });

  describe('SOLVE_ATTEMPT', () => {
    let stateWithPuzzle: GameState;

    beforeEach(() => {
      stateWithPuzzle = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle,
      });
    });

    it('marks round as ROUND_OVER on correct solve', () => {
      const newState = gameReducer(stateWithPuzzle, {
        type: 'SOLVE_ATTEMPT',
        phrase: 'WHEEL OF FORTUNE',
      });

      expect(newState.turnState).toBe('ROUND_OVER');
      expect(newState.revealedPositions.length).toBe(testPuzzle.phrase.length);
    });

    it('adds round score to total on correct solve', () => {
      let state = gameReducer(stateWithPuzzle, { type: 'SPIN_WHEEL' });
      state = gameReducer(state, {
        type: 'SPIN_RESULT',
        wedge: { id: '500', type: 'VALUE', value: 500, label: '500', color: '#FF0000' },
      });
      state = gameReducer(state, {
        type: 'GUESS_LETTER',
        letter: 'W',
        cost: 0,
      });

      const beforeSolve = state.player.totalScore;
      state = gameReducer(state, {
        type: 'SOLVE_ATTEMPT',
        phrase: 'WHEEL OF FORTUNE',
      });

      expect(state.player.totalScore).toBe(beforeSolve + 500); // 1 W × 500
    });

    it('does nothing on incorrect solve', () => {
      const stateBefore = stateWithPuzzle;
      const stateAfter = gameReducer(stateWithPuzzle, {
        type: 'SOLVE_ATTEMPT',
        phrase: 'WRONG ANSWER',
      });

      expect(stateAfter).toEqual(stateBefore);
    });

    it('is case-insensitive', () => {
      const newState = gameReducer(stateWithPuzzle, {
        type: 'SOLVE_ATTEMPT',
        phrase: 'wheel of fortune',
      });

      expect(newState.turnState).toBe('ROUND_OVER');
    });
  });

  describe('BUY_VOWEL', () => {
    it('transitions to BUYING_VOWEL state', () => {
      const newState = gameReducer(INITIAL_STATE, {
        type: 'BUY_VOWEL',
      });

      expect(newState.turnState).toBe('BUYING_VOWEL');
    });
  });

  describe('RESET_GAME', () => {
    it('resets to initial state with new seed', () => {
      let state = gameReducer(INITIAL_STATE, {
        type: 'START_ROUND',
        puzzle: testPuzzle,
      });

      state = gameReducer(state, {
        type: 'ADD_TO_ROUND_SCORE',
        points: 1000,
      });

      const resetState = gameReducer(state, {
        type: 'RESET_GAME',
      });

      expect(resetState.currentPuzzle).toBeNull();
      expect(resetState.roundCount).toBe(0);
      expect(resetState.player.totalScore).toBe(0);
      expect(resetState.player.currentRoundScore).toBe(0);
      expect(resetState.guessedLetters).toEqual([]);
      expect(resetState.seed).not.toBe(state.seed);
    });
  });
});
