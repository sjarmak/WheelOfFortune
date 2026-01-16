import { describe, it, expect } from 'vitest';
import {
  kidGameReducer,
  INITIAL_KID_GAME_STATE,
  getKidWheelOutcome,
  shouldShowHintNudge,
  getCurrentHintType,
  KidGameState
} from './kidGame';
import { KID_WHEEL_CONFIG, HINT_SEQUENCE } from './kidTypes';
import { Puzzle } from './types';
import { getSuggestedLetters, getUnrevealedLetters } from './letterSuggestions';

describe('Kid Mode Game Reducer', () => {
  const testPuzzle: Puzzle = {
    id: 'test-1',
    phrase: 'BIG DOG',
    category: 'ANIMALS',
    round_type: 'MAIN'
  };

  const longerPuzzle: Puzzle = {
    id: 'test-2',
    phrase: 'HAPPY BIRTHDAY',
    category: 'SIMPLE_PHRASES',
    round_type: 'MAIN'
  };

  describe('KID_START_ROUND', () => {
    it('should initialize a new round with empty guessed letters and revealed positions', () => {
      const state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      expect(state.currentPuzzle).toEqual(testPuzzle);
      expect(state.guessedLetters).toEqual([]);
      expect(state.revealedPositions).toEqual([]);
      expect(state.turnState).toBe('IDLE');
      expect(state.kidState.hintMeterUsed).toBe(0);
      expect(state.kidState.starsThisRound).toBe(0);
    });

    it('should generate initial letter suggestions', () => {
      const state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      expect(state.kidState.letterSuggestions.length).toBe(3);
      // Suggestions should be letters not yet guessed
      for (const letter of state.kidState.letterSuggestions) {
        expect(state.guessedLetters).not.toContain(letter);
      }
    });

    it('should preserve total stars from previous rounds', () => {
      const stateWithStars: KidGameState = {
        ...INITIAL_KID_GAME_STATE,
        kidState: {
          ...INITIAL_KID_GAME_STATE.kidState,
          stars: 50
        }
      };

      const state = kidGameReducer(stateWithStars, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      expect(state.kidState.stars).toBe(50);
      expect(state.kidState.starsThisRound).toBe(0);
    });
  });

  describe('Deterministic Spin Outcomes', () => {
    it('should produce deterministic outcomes with same seed', () => {
      const outcome1 = getKidWheelOutcome(42);
      const outcome2 = getKidWheelOutcome(42);

      expect(outcome1).toEqual(outcome2);
    });

    it('should produce different outcomes with different seeds', () => {
      const outcome1 = getKidWheelOutcome(42);
      const outcome2 = getKidWheelOutcome(123);

      // This might rarely fail if seeds happen to produce same index
      // but probability is low (1/16)
      expect(outcome1.type === outcome2.type && outcome1.value === outcome2.value).toBe(false);
    });

    it('should return valid kid wheel outcomes', () => {
      for (let seed = 0; seed < 100; seed++) {
        const outcome = getKidWheelOutcome(seed);
        expect(KID_WHEEL_CONFIG).toContainEqual(outcome);
      }
    });
  });

  describe('KID_GUESS_LETTER', () => {
    it('should reveal all instances of a correct letter', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: longerPuzzle, // "HAPPY BIRTHDAY"
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'A' });

      // 'A' appears at positions 1 and 12 in "HAPPY BIRTHDAY"
      // H=0, A=1, P=2, P=3, Y=4, space=5, B=6, I=7, R=8, T=9, H=10, D=11, A=12, Y=13
      expect(state.guessedLetters).toContain('A');
      expect(state.revealedPositions).toContain(1);   // H[A]PPY
      expect(state.revealedPositions).toContain(12);  // BIRTHD[A]Y
    });

    it('should have no penalty for wrong letter guess', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      const initialStars = state.kidState.starsThisRound;

      // Guess a letter not in puzzle
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'X' });

      // Should not lose stars
      expect(state.kidState.starsThisRound).toBe(initialStars);
      // Letter should be added to guessed
      expect(state.guessedLetters).toContain('X');
      // Should return to IDLE
      expect(state.turnState).toBe('IDLE');
    });

    it('should prevent duplicate letter guesses', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'B' });
      const guessedAfterFirst = [...state.guessedLetters];
      const revealedAfterFirst = [...state.revealedPositions];

      // Guess same letter again
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'B' });

      // State should be unchanged
      expect(state.guessedLetters).toEqual(guessedAfterFirst);
      expect(state.revealedPositions).toEqual(revealedAfterFirst);
    });

    it('should update letter suggestions after guess', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      const initialSuggestions = [...state.kidState.letterSuggestions];

      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'B' });

      // Suggestions should not contain guessed letter
      expect(state.kidState.letterSuggestions).not.toContain('B');
    });

    it('should increment actionsWithoutProgress on wrong guess', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      expect(state.kidState.actionsWithoutProgress).toBe(0);

      // Wrong guess
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'X' });
      expect(state.kidState.actionsWithoutProgress).toBe(1);

      // Another wrong guess
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Z' });
      expect(state.kidState.actionsWithoutProgress).toBe(2);
    });

    it('should reset actionsWithoutProgress on correct guess', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      // Wrong guesses
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'X' });
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Z' });
      expect(state.kidState.actionsWithoutProgress).toBe(2);

      // Correct guess
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'B' });
      expect(state.kidState.actionsWithoutProgress).toBe(0);
    });
  });

  describe('Hint System', () => {
    it('should reveal a consonant on first hint (REVEAL_CONSONANT)', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      expect(state.kidState.hintMeterUsed).toBe(0);

      state = kidGameReducer(state, { type: 'KID_USE_HINT' });

      expect(state.kidState.hintMeterUsed).toBe(1);
      // Should have revealed some letters
      expect(state.revealedPositions.length).toBeGreaterThan(0);
    });

    it('should follow hint sequence deterministically', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: longerPuzzle, // "HAPPY BIRTHDAY"
        seed: 42
      });

      // Use all hints
      for (let i = 0; i < 4; i++) {
        const expectedHint = HINT_SEQUENCE[i];
        const currentHint = getCurrentHintType(state);
        expect(currentHint).toBe(expectedHint);

        state = kidGameReducer(state, { type: 'KID_USE_HINT' });
        expect(state.kidState.hintMeterUsed).toBe(i + 1);
      }

      // No more hints available
      expect(getCurrentHintType(state)).toBeNull();
    });

    it('should produce same hint results with same seed', () => {
      // First run
      let state1 = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });
      state1 = kidGameReducer(state1, { type: 'KID_USE_HINT' });

      // Second run with same seed
      let state2 = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });
      state2 = kidGameReducer(state2, { type: 'KID_USE_HINT' });

      expect(state1.revealedPositions).toEqual(state2.revealedPositions);
      expect(state1.guessedLetters).toEqual(state2.guessedLetters);
    });
  });

  describe('Puzzle Completion', () => {
    it('should set turnState to ROUND_OVER when puzzle is solved', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      // Guess all letters
      const letters = ['B', 'I', 'G', 'D', 'O'];
      for (const letter of letters) {
        state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter });
      }

      expect(state.turnState).toBe('ROUND_OVER');
    });

    it('should award stars on solve', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      // Solve via KID_SOLVE_PUZZLE
      state = kidGameReducer(state, { type: 'KID_SOLVE_PUZZLE' });

      expect(state.turnState).toBe('ROUND_OVER');
      expect(state.kidState.stars).toBeGreaterThan(0);
    });
  });

  describe('Nudge Detection', () => {
    it('should show nudge after threshold actions without progress', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      expect(shouldShowHintNudge(state, 3)).toBe(false);

      // Make 3 wrong guesses
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'X' });
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Y' });
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Z' });

      expect(shouldShowHintNudge(state, 3)).toBe(true);
    });

    it('should not show nudge when all hints used', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: longerPuzzle,
        seed: 42
      });

      // Use all hints
      for (let i = 0; i < 4; i++) {
        state = kidGameReducer(state, { type: 'KID_USE_HINT' });
      }

      // Make wrong guesses
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'X' });
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Z' });
      state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'Q' });

      // Should not show nudge since no hints available
      expect(shouldShowHintNudge(state, 3)).toBe(false);
    });
  });

  describe('Word Builder Mode', () => {
    it('should enter and exit word builder mode', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_ENTER_WORD_BUILDER' });
      expect(state.turnState).toBe('WORD_BUILDER');
      expect(state.kidState.wordBuilderMode).toBe(true);

      state = kidGameReducer(state, { type: 'KID_EXIT_WORD_BUILDER' });
      expect(state.turnState).toBe('IDLE');
      expect(state.kidState.wordBuilderMode).toBe(false);
    });

    it('should accept letter input in word builder', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_ENTER_WORD_BUILDER' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'B' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'I' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'G' });

      expect(state.kidState.wordBuilderInput).toEqual(['B', 'I', 'G']);
    });

    it('should clear word builder input', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle,
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_ENTER_WORD_BUILDER' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'B' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'I' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_CLEAR' });

      expect(state.kidState.wordBuilderInput).toEqual([]);
    });

    it('should reveal word and award stars on correct word check', () => {
      let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
        type: 'KID_START_ROUND',
        puzzle: testPuzzle, // "BIG DOG"
        seed: 42
      });

      state = kidGameReducer(state, { type: 'KID_ENTER_WORD_BUILDER' });
      // Type "BIG" (first word)
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'B' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'I' });
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_INPUT', letter: 'G' });

      const starsBefore = state.kidState.starsThisRound;
      state = kidGameReducer(state, { type: 'KID_WORD_BUILDER_CHECK' });

      // Word should be revealed (positions 0, 1, 2)
      expect(state.revealedPositions).toContain(0);
      expect(state.revealedPositions).toContain(1);
      expect(state.revealedPositions).toContain(2);

      // Should earn stars
      expect(state.kidState.starsThisRound).toBeGreaterThan(starsBefore);

      // Should advance to next word
      expect(state.kidState.currentBuildWord).toBe(1);
      expect(state.kidState.wordBuilderInput).toEqual([]);
    });
  });
});

describe('Letter Suggestions', () => {
  it('should exclude already guessed letters', () => {
    const phrase = 'BIG DOG';
    const guessedLetters = ['B', 'I'];
    const revealedPositions = [0, 1]; // B, I revealed

    const suggestions = getSuggestedLetters(phrase, guessedLetters, revealedPositions, 3, 42);

    expect(suggestions).not.toContain('B');
    expect(suggestions).not.toContain('I');
  });

  it('should prefer letters present in puzzle', () => {
    const phrase = 'DOG';
    const guessedLetters: string[] = [];
    const revealedPositions: number[] = [];

    // Get multiple sets of suggestions
    const allSuggestions: string[] = [];
    for (let seed = 0; seed < 10; seed++) {
      const suggestions = getSuggestedLetters(phrase, guessedLetters, revealedPositions, 3, seed);
      allSuggestions.push(...suggestions);
    }

    // Letters in puzzle should appear frequently
    const puzzleLetters = ['D', 'O', 'G'];
    const inPuzzleCount = allSuggestions.filter(l => puzzleLetters.includes(l)).length;
    const totalCount = allSuggestions.length;

    // At least 30% should be letters in the puzzle (probabilistic assertion)
    expect(inPuzzleCount / totalCount).toBeGreaterThan(0.3);
  });

  it('should return consistent suggestions with same seed', () => {
    const phrase = 'HELLO WORLD';
    const guessedLetters: string[] = [];
    const revealedPositions: number[] = [];

    const suggestions1 = getSuggestedLetters(phrase, guessedLetters, revealedPositions, 3, 42);
    const suggestions2 = getSuggestedLetters(phrase, guessedLetters, revealedPositions, 3, 42);

    expect(suggestions1).toEqual(suggestions2);
  });

  it('should return unrevealed letters correctly', () => {
    const phrase = 'CAT';
    const guessedLetters = ['C', 'A'];

    const unrevealed = getUnrevealedLetters(phrase, guessedLetters);

    expect(unrevealed).toContain('T');
    expect(unrevealed).not.toContain('C');
    expect(unrevealed).not.toContain('A');
  });
});

describe('Spin Outcomes Integration', () => {
  const testPuzzle: Puzzle = {
    id: 'test-1',
    phrase: 'HELLO WORLD',
    category: 'TEST',
    round_type: 'MAIN'
  };

  it('should handle REVEAL_ONE outcome', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    const outcome = { type: 'REVEAL_ONE' as const, value: 1, label: 'REVEAL!', color: '#4CAF50', emoji: '🔤' };

    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome });

    // Should have revealed at least one letter
    expect(state.revealedPositions.length).toBeGreaterThan(0);
    expect(state.turnState).toBe('SHOWING_OUTCOME');
    expect(state.kidState.lastOutcome).toEqual(outcome);
  });

  it('should handle BONUS_STARS outcome', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    const outcome = { type: 'BONUS_STARS' as const, value: 3, label: '3 STARS', color: '#FFD700', emoji: '⭐' };
    const starsBefore = state.kidState.starsThisRound;

    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome });

    expect(state.kidState.starsThisRound).toBe(starsBefore + 3);
    expect(state.turnState).toBe('SHOWING_OUTCOME');
  });

  it('should handle HINT_TOKEN outcome', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    const outcome = { type: 'HINT_TOKEN' as const, value: 1, label: 'FREE HINT', color: '#3F51B5', emoji: '💡' };

    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome });

    expect(state.kidState.hintTokens).toBe(1);
  });

  it('should handle CHOOSE_LETTER outcome', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    const outcome = { type: 'CHOOSE_LETTER' as const, value: 3, label: 'PICK ONE', color: '#9C27B0', emoji: '🎯' };

    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome });

    expect(state.turnState).toBe('SHOWING_OUTCOME');

    // Dismiss to get to CHOOSING_LETTER state
    state = kidGameReducer(state, { type: 'KID_DISMISS_OUTCOME' });
    expect(state.turnState).toBe('CHOOSING_LETTER');

    // Should have updated suggestions
    expect(state.kidState.letterSuggestions.length).toBe(3);
  });
});

describe('VOWEL_PLUS Wheel Outcome', () => {
  const testPuzzle: Puzzle = {
    id: 'test-vowel-plus',
    phrase: 'APPLE',
    category: 'FRUITS',
    round_type: 'MAIN'
  };

  it('should set vowelPlusPhase to "vowel" when vowels are available', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    const vowelPlusOutcome = { type: 'VOWEL_PLUS' as const, value: 2, label: 'VOWEL+' };
    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome: vowelPlusOutcome });

    // Should set vowelPlusPhase to 'vowel' to let kid pick
    expect(state.kidState.vowelPlusPhase).toBe('vowel');
    expect(state.turnState).toBe('SHOWING_OUTCOME');
    expect(state.kidState.lastOutcome).toEqual(vowelPlusOutcome);

    // Dismiss outcome to transition to PICKING_VOWEL
    state = kidGameReducer(state, { type: 'KID_DISMISS_OUTCOME' });
    expect(state.turnState).toBe('PICKING_VOWEL');
  });

  it('should apply hint instead when all vowels are already guessed', () => {
    let state = kidGameReducer(INITIAL_KID_GAME_STATE, {
      type: 'KID_START_ROUND',
      puzzle: testPuzzle,
      seed: 42
    });

    // Guess all vowels (A, E)
    state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'A' });
    state = kidGameReducer(state, { type: 'KID_GUESS_LETTER', letter: 'E' });

    expect(state.guessedLetters).toContain('A');
    expect(state.guessedLetters).toContain('E');

    const revealedBefore = state.revealedPositions.length;

    // Now spin and land on VOWEL_PLUS
    const vowelPlusOutcome = { type: 'VOWEL_PLUS' as const, value: 2, label: 'VOWEL+' };
    state = kidGameReducer(state, { type: 'KID_SPIN_RESULT', outcome: vowelPlusOutcome });

    // Should NOT set vowelPlusPhase to 'vowel' - should apply hint instead
    expect(state.kidState.vowelPlusPhase).toBeNull();
    // Should have used one hint (first hint in sequence is REVEAL_CONSONANT)
    expect(state.kidState.hintMeterUsed).toBe(1);
    // Should have revealed additional letters from hint
    expect(state.revealedPositions.length).toBeGreaterThan(revealedBefore);
    // Should be showing outcome
    expect(state.turnState).toBe('SHOWING_OUTCOME');
  });
});
