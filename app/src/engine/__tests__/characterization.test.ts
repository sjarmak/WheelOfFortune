/**
 * Characterization tests for the current web game reducer.
 *
 * PURPOSE: Snapshot the CURRENT behavior of app/src/engine/game.ts BEFORE any
 * upcoming reducer refactors. These tests document reality — if any of them
 * fail against the current reducer, the TEST is wrong, not the reducer.
 *
 * Update policy: see app/src/engine/__tests__/SNAPSHOT_LOCK.md.
 *
 * Reducer SHA at time of capture: b9c4cc8a4550d6ece417a2312d7bc7f69378936c
 */
import { describe, test, expect } from 'vitest';
import { gameReducer, INITIAL_STATE } from '../game';
import { Puzzle, WheelWedge } from '../types';

const mainPuzzle: Puzzle = {
  id: 'p-main',
  phrase: 'HELLO WORLD',
  category: 'PHRASE',
  round_type: 'MAIN',
};

const bonusPuzzle: Puzzle = {
  id: 'p-bonus',
  phrase: 'NEW THING',
  category: 'THING',
  round_type: 'BONUS',
};

const tossupPuzzle: Puzzle = {
  id: 'p-toss',
  phrase: 'BIG CAT',
  category: 'ANIMAL',
  round_type: 'TOSSUP',
};

// Helper: build a minimally valid wedge. Uses `as const` for literal type on `type`.
function cashWedge(value: number): WheelWedge {
  return { id: 'w-cash', type: 'VALUE', value, label: `$${value}`, color: '#000' };
}
const bankruptWedge: WheelWedge = {
  id: 'w-bk',
  type: 'BANKRUPT',
  value: 0,
  label: 'BANKRUPT',
  color: '#000',
};
const loseTurnWedge: WheelWedge = {
  id: 'w-lt',
  type: 'LOSE_TURN',
  value: 0,
  label: 'LOSE A TURN',
  color: '#FFF',
};
describe('Characterization: current web reducer behavior', () => {
  // ---------------------------------------------------------------------------
  // Initial state shape
  // ---------------------------------------------------------------------------
  test('INITIAL_STATE shape matches captured snapshot', () => {
    // Seed is Date.now() at module load, so we normalize it for comparison.
    const normalized = { ...INITIAL_STATE, seed: 0 };
    expect(normalized).toEqual({
      currentPuzzle: null,
      guessedLetters: [],
      revealedPositions: [],
      spinResult: null,
      turnState: 'IDLE',
      player: { currentRoundScore: 0, totalScore: 0 },
      tossUpRevealOrder: [],
      tossUpIndex: 0,
      bonusTimer: 10,
      bonusPicks: [],
      packId: 'default',
      seed: 0,
      roundCount: 0,
      spinCount: 0,
    });
    // The real INITIAL_STATE has a numeric seed
    expect(typeof INITIAL_STATE.seed).toBe('number');
  });

  // ---------------------------------------------------------------------------
  // START_ROUND
  // ---------------------------------------------------------------------------
  test('START_ROUND on MAIN puzzle initializes round fields and increments roundCount', () => {
    const state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mainPuzzle,
      seed: 42,
    });

    expect(state.currentPuzzle).toBe(mainPuzzle);
    expect(state.guessedLetters).toEqual([]);
    expect(state.revealedPositions).toEqual([]);
    expect(state.spinResult).toBeNull();
    expect(state.turnState).toBe('IDLE');
    expect(state.player.currentRoundScore).toBe(0);
    expect(state.roundCount).toBe(INITIAL_STATE.roundCount + 1);
    expect(state.spinCount).toBe(0);
    expect(state.tossUpIndex).toBe(0);
    // tossUpRevealOrder contains shuffled letter-positions only
    const letterPositions = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10]; // 'HELLO WORLD' skips index 5 (space)
    expect([...state.tossUpRevealOrder].sort((a, b) => a - b)).toEqual(letterPositions);
  });

  test('START_ROUND on BONUS puzzle pre-reveals RSTLNE letters and seeds guessedLetters', () => {
    const state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: bonusPuzzle, // 'NEW THING'
      seed: 1,
    });

    // Expected reveals for 'NEW THING': N(0), E(1), T(4), N(6)? Actually let's compute:
    // 'N','E','W',' ','T','H','I','N','G'
    //  0   1   2   3   4   5   6   7   8
    // RSTLNE present: N(0), E(1), T(4), N(7). 'I','G','W','H' not in RSTLNE. (I is vowel but not in RSTLNE.)
    expect(state.revealedPositions.sort((a, b) => a - b)).toEqual([0, 1, 4, 7]);
    expect(state.guessedLetters).toEqual(['R', 'S', 'T', 'L', 'N', 'E']);
  });

  test('START_ROUND on TOSSUP puzzle leaves revealedPositions empty and turnState IDLE', () => {
    const state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: tossupPuzzle,
      seed: 7,
    });
    expect(state.revealedPositions).toEqual([]);
    expect(state.turnState).toBe('IDLE');
    expect(state.guessedLetters).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // SPIN_WHEEL
  // ---------------------------------------------------------------------------
  test('SPIN_WHEEL sets turnState to SPINNING and increments spinCount', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: mainPuzzle,
      seed: 1,
    });
    expect(state.spinCount).toBe(0);

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    expect(state.turnState).toBe('SPINNING');
    expect(state.spinCount).toBe(1);

    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    expect(state.spinCount).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // SPIN_RESULT wedge-type branches
  // ---------------------------------------------------------------------------
  test('SPIN_RESULT on VALUE wedge sets spinResult to value and enters GUESSING_CONSONANT', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge(500) });

    expect(state.spinResult).toBe(500);
    expect(state.turnState).toBe('GUESSING_CONSONANT');
  });

  test('SPIN_RESULT on BANKRUPT wedge clears currentRoundScore, spinResult=BANKRUPT, turnState=IDLE', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 1200, totalScore: 4000 },
    };
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: bankruptWedge });

    expect(state.spinResult).toBe('BANKRUPT');
    expect(state.player.currentRoundScore).toBe(0);
    expect(state.player.totalScore).toBe(4000);
    expect(state.turnState).toBe('IDLE');
  });

  test('SPIN_RESULT on LOSE_TURN wedge preserves currentRoundScore, sets spinResult=LOSE_TURN', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 900, totalScore: 2000 },
    };
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: loseTurnWedge });

    expect(state.spinResult).toBe('LOSE_TURN');
    expect(state.player.currentRoundScore).toBe(900);
    expect(state.turnState).toBe('IDLE');
  });

  // ---------------------------------------------------------------------------
  // GUESS_LETTER — correct consonant
  // ---------------------------------------------------------------------------
  test('GUESS_LETTER correct consonant reveals all occurrences and adds spinResult*count to score', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge(500) });

    // 'HELLO WORLD' has L at positions 2, 3, 9
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'L', cost: 0 });

    expect(state.guessedLetters).toContain('L');
    expect(state.revealedPositions.sort((a, b) => a - b)).toEqual([2, 3, 9]);
    expect(state.player.currentRoundScore).toBe(1500); // 500 * 3
    expect(state.turnState).toBe('IDLE');
    // spinResult is preserved so the UI can continue the turn
    expect(state.spinResult).toBe(500);
  });

  // ---------------------------------------------------------------------------
  // GUESS_LETTER — incorrect consonant
  // ---------------------------------------------------------------------------
  test('GUESS_LETTER incorrect consonant does not change score, records guess, returns turnState to IDLE', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge(500) });

    // 'HELLO WORLD' has no 'Z'
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'Z', cost: 0 });

    expect(state.guessedLetters).toContain('Z');
    expect(state.revealedPositions).toEqual([]);
    expect(state.player.currentRoundScore).toBe(0);
    expect(state.turnState).toBe('IDLE');
  });

  test('GUESS_LETTER guessing a letter already guessed returns state unchanged', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = gameReducer(state, { type: 'SPIN_WHEEL' });
    state = gameReducer(state, { type: 'SPIN_RESULT', wedge: cashWedge(500) });
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'L', cost: 0 });

    const snapshot = state;
    const next = gameReducer(state, { type: 'GUESS_LETTER', letter: 'L', cost: 0 });
    // The reducer returns the same object reference for duplicate guesses
    expect(next).toBe(snapshot);
  });

  // ---------------------------------------------------------------------------
  // BUY_VOWEL
  // ---------------------------------------------------------------------------
  test('BUY_VOWEL action transitions turnState to BUYING_VOWEL (does not deduct yet)', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 500 },
    };
    const prevScore = state.player.currentRoundScore;

    state = gameReducer(state, { type: 'BUY_VOWEL' });
    expect(state.turnState).toBe('BUYING_VOWEL');
    // BUY_VOWEL itself does not change the score; cost is applied via GUESS_LETTER
    expect(state.player.currentRoundScore).toBe(prevScore);
  });

  test('GUESS_LETTER vowel deducts cost and reveals vowel positions (no consonant multiplier)', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 500 },
      // spinResult intentionally null to show vowel purchases ignore spinResult
      spinResult: null,
    };
    state = gameReducer(state, { type: 'BUY_VOWEL' });
    state = gameReducer(state, { type: 'GUESS_LETTER', letter: 'O', cost: 250 });

    expect(state.guessedLetters).toContain('O');
    // 'HELLO WORLD' has O at positions 4 and 7
    expect(state.revealedPositions.sort((a, b) => a - b)).toEqual([4, 7]);
    // Vowel is not a consonant, so no spinResult*count addition; only cost deducted
    expect(state.player.currentRoundScore).toBe(250); // 500 - 250
    expect(state.turnState).toBe('IDLE');
  });

  // ---------------------------------------------------------------------------
  // SOLVE_ATTEMPT
  // ---------------------------------------------------------------------------
  test('SOLVE_ATTEMPT correct reveals all positions, ends round, banks currentRoundScore to totalScore', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 2000, totalScore: 3000 },
    };

    state = gameReducer(state, { type: 'SOLVE_ATTEMPT', phrase: 'hello world' });

    expect(state.turnState).toBe('ROUND_OVER');
    expect(state.revealedPositions).toEqual(
      Array.from({ length: mainPuzzle.phrase.length }, (_, i) => i),
    );
    expect(state.player.totalScore).toBe(5000); // 3000 + 2000
    expect(state.player.currentRoundScore).toBe(2000); // not cleared by SOLVE_ATTEMPT
  });

  test('SOLVE_ATTEMPT incorrect returns state reference unchanged', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = {
      ...state,
      player: { ...state.player, currentRoundScore: 1000, totalScore: 100 },
    };

    const next = gameReducer(state, { type: 'SOLVE_ATTEMPT', phrase: 'NOT THE ANSWER' });
    // Incorrect solve is a no-op at the reducer level; UI handles turn-loss
    expect(next).toBe(state);
    expect(next.turnState).toBe('IDLE');
    expect(next.player.totalScore).toBe(100);
  });

  // ---------------------------------------------------------------------------
  // TOSS_UP_TICK
  // ---------------------------------------------------------------------------
  test('TOSS_UP_TICK reveals next position from tossUpRevealOrder and increments tossUpIndex', () => {
    let state = gameReducer(INITIAL_STATE, {
      type: 'START_ROUND',
      puzzle: tossupPuzzle,
      seed: 123,
    });
    const order = state.tossUpRevealOrder;
    expect(order.length).toBeGreaterThan(0);

    state = gameReducer(state, { type: 'TOSS_UP_TICK' });
    expect(state.tossUpIndex).toBe(1);
    expect(state.revealedPositions).toEqual([order[0]]);

    state = gameReducer(state, { type: 'TOSS_UP_TICK' });
    expect(state.tossUpIndex).toBe(2);
    expect(state.revealedPositions).toEqual([order[0], order[1]]);
  });

  // ---------------------------------------------------------------------------
  // ADD_TO_ROUND_SCORE / CLEAR_ROUND_SCORE
  // ---------------------------------------------------------------------------
  test('ADD_TO_ROUND_SCORE adds points to currentRoundScore only', () => {
    const state = gameReducer(INITIAL_STATE, { type: 'ADD_TO_ROUND_SCORE', points: 250 });
    expect(state.player.currentRoundScore).toBe(250);
    expect(state.player.totalScore).toBe(0);
  });

  test('CLEAR_ROUND_SCORE resets currentRoundScore, preserves totalScore', () => {
    const seeded = {
      ...INITIAL_STATE,
      player: { ...INITIAL_STATE.player, currentRoundScore: 900, totalScore: 4200 },
    };
    const state = gameReducer(seeded, { type: 'CLEAR_ROUND_SCORE' });
    expect(state.player.currentRoundScore).toBe(0);
    expect(state.player.totalScore).toBe(4200);
  });

  // ---------------------------------------------------------------------------
  // RESET_GAME
  // ---------------------------------------------------------------------------
  test('RESET_GAME returns INITIAL_STATE shape with a fresh seed', () => {
    let state = gameReducer(INITIAL_STATE, { type: 'START_ROUND', puzzle: mainPuzzle, seed: 1 });
    state = gameReducer(state, {
      type: 'GUESS_LETTER',
      letter: 'E',
      cost: 0,
    });

    const reset = gameReducer(state, { type: 'RESET_GAME' });
    // Normalize seed since it's Date.now() at reset time.
    const { seed, ...rest } = reset;
    const { seed: _initialSeed, ...initialRest } = INITIAL_STATE;
    expect(rest).toEqual(initialRest);
    expect(typeof seed).toBe('number');
  });

  // ---------------------------------------------------------------------------
  // Unknown action
  // ---------------------------------------------------------------------------
  test('unknown action returns the same state reference', () => {
    // Casting through unknown because the GameAction union doesn't include this type.
    const unknownAction = { type: 'NOT_A_REAL_ACTION' } as unknown as Parameters<
      typeof gameReducer
    >[1];
    const next = gameReducer(INITIAL_STATE, unknownAction);
    expect(next).toBe(INITIAL_STATE);
  });

  // ---------------------------------------------------------------------------
  // Current wedge types snapshot
  // ---------------------------------------------------------------------------
  test('WheelWedge.type supports VALUE, BANKRUPT, LOSE_TURN (documented union after remove-free-play)', () => {
    const wedges: WheelWedge[] = [
      { id: '1', type: 'VALUE', value: 500, label: '$500', color: '#000' },
      { id: '2', type: 'BANKRUPT', value: 0, label: 'BANKRUPT', color: '#000' },
      { id: '3', type: 'LOSE_TURN', value: 0, label: 'LOSE A TURN', color: '#FFF' },
    ];
    expect(wedges.map((w) => w.type)).toEqual(['VALUE', 'BANKRUPT', 'LOSE_TURN']);
  });
});

// -----------------------------------------------------------------------------
// KID_HYDRATE_STATE
// -----------------------------------------------------------------------------
// At reducer SHA b9c4cc8a4550d6ece417a2312d7bc7f69378936c, app/src/engine/kidGame.ts
// does NOT define a KID_HYDRATE_STATE action. The acceptance criteria say to
// skip these tests if absent; we encode that explicitly so the skip is
// intentional and traceable, not silently missing.
describe.skip('Characterization: KID_HYDRATE_STATE (absent at capture time)', () => {
  test('KID_HYDRATE_STATE is not defined in kidGame.ts — nothing to snapshot', () => {
    // Intentionally empty. See SNAPSHOT_LOCK.md for update rules if added later.
  });
});
