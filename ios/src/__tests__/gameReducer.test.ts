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
