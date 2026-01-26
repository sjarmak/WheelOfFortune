import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE, GameAction } from "../engine/game";
import { GameState, Puzzle } from "../engine/types";

const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "puzzle-1",
  phrase: "HELLO WORLD",
  category: "PHRASE",
  round_type: "MAIN",
  ...overrides,
});

function stateWithPuzzleInProgress(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    ...INITIAL_STATE,
    currentPuzzle: makePuzzle(),
    guessedLetters: ["H", "E", "L"],
    revealedPositions: [0, 1, 2, 3],
    spinResult: 500,
    turnState: "GUESSING_CONSONANT",
    player: { currentRoundScore: 1500, totalScore: 3000 },
    roundCount: 2,
    ...overrides,
  };
}

describe("RESET_ROUND", () => {
  it("clears guessedLetters, revealedPositions, spinResult", () => {
    const state = stateWithPuzzleInProgress();
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.guessedLetters).toEqual([]);
    expect(result.revealedPositions).toEqual([]);
    expect(result.spinResult).toBeNull();
  });

  it("resets turnState to IDLE", () => {
    const state = stateWithPuzzleInProgress({ turnState: "SOLVING" });
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.turnState).toBe("IDLE");
  });

  it("resets currentRoundScore to 0", () => {
    const state = stateWithPuzzleInProgress();
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.player.currentRoundScore).toBe(0);
  });

  it("keeps same currentPuzzle", () => {
    const puzzle = makePuzzle({ id: "keep-me" });
    const state = stateWithPuzzleInProgress({ currentPuzzle: puzzle });
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.currentPuzzle).toBe(puzzle);
  });

  it("keeps totalScore unchanged", () => {
    const state = stateWithPuzzleInProgress({
      player: { currentRoundScore: 1500, totalScore: 5000 },
    });
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.player.totalScore).toBe(5000);
  });

  it("preserves roundCount and other meta fields", () => {
    const state = stateWithPuzzleInProgress({
      roundCount: 5,
      spinCount: 3,
      packId: "custom-pack",
    });
    const result = gameReducer(state, { type: "RESET_ROUND" });

    expect(result.roundCount).toBe(5);
    expect(result.spinCount).toBe(3);
    expect(result.packId).toBe("custom-pack");
  });
});

describe("RANDOM_PUZZLE", () => {
  const puzzles: Puzzle[] = [
    makePuzzle({ id: "p1", phrase: "ALPHA" }),
    makePuzzle({ id: "p2", phrase: "BRAVO" }),
    makePuzzle({ id: "p3", phrase: "CHARLIE" }),
  ];

  it("selects a different puzzle from the array", () => {
    const currentPuzzle = puzzles[0];
    const state = stateWithPuzzleInProgress({ currentPuzzle });
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles,
    });

    expect(result.currentPuzzle).not.toBeNull();
    expect(result.currentPuzzle!.id).not.toBe("p1");
    expect(["p2", "p3"]).toContain(result.currentPuzzle!.id);
  });

  it("resets round state when selecting random puzzle", () => {
    const state = stateWithPuzzleInProgress({ currentPuzzle: puzzles[0] });
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles,
    });

    expect(result.guessedLetters).toEqual([]);
    expect(result.revealedPositions).toEqual([]);
    expect(result.spinResult).toBeNull();
    expect(result.turnState).toBe("IDLE");
    expect(result.player.currentRoundScore).toBe(0);
  });

  it("preserves totalScore when selecting random puzzle", () => {
    const state = stateWithPuzzleInProgress({
      currentPuzzle: puzzles[0],
      player: { currentRoundScore: 1000, totalScore: 5000 },
    });
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles,
    });

    expect(result.player.totalScore).toBe(5000);
  });

  it("returns unchanged state when only one puzzle matches current", () => {
    const singlePuzzle = puzzles[0];
    const state = stateWithPuzzleInProgress({ currentPuzzle: singlePuzzle });
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles: [singlePuzzle],
    });

    expect(result).toBe(state);
  });

  it("returns unchanged state for empty puzzles array", () => {
    const state = stateWithPuzzleInProgress();
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles: [],
    });

    expect(result).toBe(state);
  });

  it("works when currentPuzzle is null", () => {
    const state = { ...INITIAL_STATE, currentPuzzle: null };
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles,
    });

    expect(result.currentPuzzle).not.toBeNull();
    expect(puzzles.map((p) => p.id)).toContain(result.currentPuzzle!.id);
  });

  it("selects from all puzzles when current puzzle is not in array", () => {
    const otherPuzzle = makePuzzle({ id: "other", phrase: "DELTA" });
    const state = stateWithPuzzleInProgress({ currentPuzzle: otherPuzzle });
    const result = gameReducer(state, {
      type: "RANDOM_PUZZLE",
      puzzles,
    });

    expect(puzzles.map((p) => p.id)).toContain(result.currentPuzzle!.id);
  });
});

describe("SELECT_PUZZLE", () => {
  it("sets the provided puzzle as currentPuzzle", () => {
    const newPuzzle = makePuzzle({ id: "selected", phrase: "NEW PHRASE" });
    const state = stateWithPuzzleInProgress();
    const result = gameReducer(state, {
      type: "SELECT_PUZZLE",
      puzzle: newPuzzle,
    });

    expect(result.currentPuzzle).toBe(newPuzzle);
  });

  it("resets round state", () => {
    const newPuzzle = makePuzzle({ id: "selected" });
    const state = stateWithPuzzleInProgress();
    const result = gameReducer(state, {
      type: "SELECT_PUZZLE",
      puzzle: newPuzzle,
    });

    expect(result.guessedLetters).toEqual([]);
    expect(result.revealedPositions).toEqual([]);
    expect(result.spinResult).toBeNull();
    expect(result.turnState).toBe("IDLE");
    expect(result.player.currentRoundScore).toBe(0);
  });

  it("preserves totalScore", () => {
    const newPuzzle = makePuzzle({ id: "selected" });
    const state = stateWithPuzzleInProgress({
      player: { currentRoundScore: 2000, totalScore: 8000 },
    });
    const result = gameReducer(state, {
      type: "SELECT_PUZZLE",
      puzzle: newPuzzle,
    });

    expect(result.player.totalScore).toBe(8000);
  });

  it("works when starting from initial state", () => {
    const newPuzzle = makePuzzle({ id: "first-puzzle" });
    const result = gameReducer(INITIAL_STATE, {
      type: "SELECT_PUZZLE",
      puzzle: newPuzzle,
    });

    expect(result.currentPuzzle).toBe(newPuzzle);
    expect(result.turnState).toBe("IDLE");
    expect(result.guessedLetters).toEqual([]);
  });

  it("preserves roundCount and meta fields", () => {
    const newPuzzle = makePuzzle({ id: "selected" });
    const state = stateWithPuzzleInProgress({
      roundCount: 7,
      spinCount: 4,
      seed: 12345,
    });
    const result = gameReducer(state, {
      type: "SELECT_PUZZLE",
      puzzle: newPuzzle,
    });

    expect(result.roundCount).toBe(7);
    expect(result.spinCount).toBe(4);
    expect(result.seed).toBe(12345);
  });
});

describe("RESET_GAME unchanged", () => {
  it("still performs full reset including totalScore", () => {
    const state = stateWithPuzzleInProgress({
      player: { currentRoundScore: 2000, totalScore: 8000 },
    });
    const result = gameReducer(state, { type: "RESET_GAME" });

    expect(result.currentPuzzle).toBeNull();
    expect(result.player.totalScore).toBe(0);
    expect(result.player.currentRoundScore).toBe(0);
    expect(result.turnState).toBe("IDLE");
  });
});

describe("Standard MAIN round flow regression", () => {
  const puzzle = makePuzzle({ phrase: "HELLO WORLD" });
  const valueWedge = {
    id: "v500",
    type: "VALUE" as const,
    value: 500,
    label: "$500",
    color: "#00FF00",
  };
  const bankruptWedge = {
    id: "bankrupt",
    type: "BANKRUPT" as const,
    value: 0,
    label: "BANKRUPT",
    color: "#000000",
  };
  const loseTurnWedge = {
    id: "lose",
    type: "LOSE_TURN" as const,
    value: 0,
    label: "LOSE A TURN",
    color: "#FFFFFF",
  };

  it("full round: start -> spin -> guess consonant -> buy vowel -> solve", () => {
    // 1. START_ROUND with MAIN puzzle sets turnState to IDLE
    let s = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle,
      seed: 42,
    });
    expect(s.turnState).toBe("IDLE");
    expect(s.currentPuzzle).toEqual(puzzle);
    expect(s.guessedLetters).toEqual([]);
    expect(s.revealedPositions).toEqual([]);
    expect(s.roundCount).toBe(1);
    expect(s.spinCount).toBe(0);
    expect(s.player.currentRoundScore).toBe(0);
    expect(s.roundResult).toBeNull();

    // 2. SPIN_WHEEL transitions to SPINNING
    s = gameReducer(s, { type: "SPIN_WHEEL" });
    expect(s.turnState).toBe("SPINNING");
    expect(s.spinCount).toBe(1);

    // 3. SPIN_RESULT with VALUE wedge transitions to GUESSING_CONSONANT
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: valueWedge });
    expect(s.turnState).toBe("GUESSING_CONSONANT");
    expect(s.spinResult).toBe(500);

    // 4. GUESS_LETTER: correct consonant 'L' (positions 2,3,9 in "HELLO WORLD")
    s = gameReducer(s, { type: "GUESS_LETTER", letter: "L", cost: 0 });
    expect(s.guessedLetters).toContain("L");
    expect(s.revealedPositions).toContain(2);
    expect(s.revealedPositions).toContain(3);
    expect(s.revealedPositions).toContain(9);
    expect(s.player.currentRoundScore).toBe(500 * 3); // 3 L's × $500
    expect(s.turnState).toBe("IDLE");
    expect(s.spinResult).toBe(500); // preserved after correct guess

    // 5. BUY_VOWEL transitions to BUYING_VOWEL
    s = gameReducer(s, { type: "BUY_VOWEL" });
    expect(s.turnState).toBe("BUYING_VOWEL");

    // 6. GUESS_LETTER: buy vowel 'O' (positions 4,7 in "HELLO WORLD")
    s = gameReducer(s, { type: "GUESS_LETTER", letter: "O", cost: 250 });
    expect(s.guessedLetters).toContain("O");
    expect(s.revealedPositions).toContain(4);
    expect(s.revealedPositions).toContain(7);
    expect(s.player.currentRoundScore).toBe(1500 - 250); // 1500 - vowel cost
    expect(s.turnState).toBe("IDLE");

    // 7. SOLVE_ATTEMPT: correct solve
    s = gameReducer(s, { type: "SOLVE_ATTEMPT", phrase: "HELLO WORLD" });
    expect(s.turnState).toBe("ROUND_OVER");
    expect(s.revealedPositions.length).toBe(puzzle.phrase.length);
    expect(s.player.totalScore).toBe(1250); // round score added to total

    // Verify new mode fields are present but unaffected
    expect(s.tossUpElapsedMs).toBe(0);
    expect(s.tossUpIndex).toBe(0);
    expect(s.bonusTimerMs).toBe(20000);
    expect(s.bonusPicks).toEqual([]);
  });

  it("BANKRUPT clears round score and sets mustSpin", () => {
    let s = gameReducer(INITIAL_STATE, { type: "START_ROUND", puzzle });
    s = gameReducer(s, { type: "SPIN_WHEEL" });
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: valueWedge });
    s = gameReducer(s, { type: "GUESS_LETTER", letter: "L", cost: 0 });
    expect(s.player.currentRoundScore).toBe(1500);

    s = gameReducer(s, { type: "SPIN_WHEEL" });
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: bankruptWedge });

    expect(s.spinResult).toBe("BANKRUPT");
    expect(s.player.currentRoundScore).toBe(0);
    expect(s.mustSpin).toBe(true);
    expect(s.turnState).toBe("IDLE");
  });

  it("LOSE_TURN sets mustSpin without clearing score", () => {
    let s = gameReducer(INITIAL_STATE, { type: "START_ROUND", puzzle });
    s = gameReducer(s, { type: "SPIN_WHEEL" });
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: valueWedge });
    s = gameReducer(s, { type: "GUESS_LETTER", letter: "L", cost: 0 });
    const scoreBefore = s.player.currentRoundScore;

    s = gameReducer(s, { type: "SPIN_WHEEL" });
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: loseTurnWedge });

    expect(s.spinResult).toBe("LOSE_TURN");
    expect(s.player.currentRoundScore).toBe(scoreBefore);
    expect(s.mustSpin).toBe(true);
    expect(s.turnState).toBe("IDLE");
  });

  it("wrong consonant guess clears spinResult and sets mustSpin", () => {
    let s = gameReducer(INITIAL_STATE, { type: "START_ROUND", puzzle });
    s = gameReducer(s, { type: "SPIN_WHEEL" });
    s = gameReducer(s, { type: "SPIN_RESULT", wedge: valueWedge });

    // 'Z' is not in "HELLO WORLD"
    s = gameReducer(s, { type: "GUESS_LETTER", letter: "Z", cost: 0 });
    expect(s.guessedLetters).toContain("Z");
    expect(s.spinResult).toBeNull();
    expect(s.mustSpin).toBe(true);
    expect(s.turnState).toBe("IDLE");
  });

  it("wrong SOLVE_ATTEMPT returns state unchanged", () => {
    let s = gameReducer(INITIAL_STATE, { type: "START_ROUND", puzzle });
    const beforeSolve = s;

    s = gameReducer(s, { type: "SOLVE_ATTEMPT", phrase: "WRONG ANSWER" });
    expect(s).toBe(beforeSolve);
  });

  it("new mode actions are no-ops during standard MAIN flow", () => {
    let s = gameReducer(INITIAL_STATE, { type: "START_ROUND", puzzle });
    expect(s.turnState).toBe("IDLE");

    // Toss-up actions should be no-ops in IDLE state
    const afterTick = gameReducer(s, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(afterTick).toBe(s);

    const afterBuzz = gameReducer(s, { type: "BUZZ_IN" });
    expect(afterBuzz).toBe(s);

    const afterTossUpSolve = gameReducer(s, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "HELLO WORLD",
    });
    expect(afterTossUpSolve).toBe(s);

    // Bonus actions should be no-ops in IDLE state
    const afterBonusChoose = gameReducer(s, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["B", "C", "D"],
      vowel: "A",
    });
    expect(afterBonusChoose).toBe(s);

    const afterBonusTick = gameReducer(s, {
      type: "BONUS_TICK",
      dtMs: 1000,
    });
    expect(afterBonusTick).toBe(s);

    const afterBonusSolve = gameReducer(s, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "HELLO WORLD",
    });
    expect(afterBonusSolve).toBe(s);
  });
});
