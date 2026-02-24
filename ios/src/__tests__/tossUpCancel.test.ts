import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE } from "../engine/game";
import { Puzzle } from "../engine/types";

const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "test-1",
  phrase: "HELLO WORLD",
  category: "PHRASE",
  round_type: "TOSSUP",
  ...overrides,
});

describe("Toss-Up Cancel", () => {
  it("should return to TOSSUP_REVEALING when cancel is pressed", () => {
    const puzzle = makePuzzle();
    
    // Start round
    let state = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle,
      seed: 42,
    });
    expect(state.turnState).toBe("TOSSUP_REVEALING");

    // Buzz in
    state = gameReducer(state, { type: "BUZZ_IN" });
    expect(state.turnState).toBe("TOSSUP_BUZZED");

    // Cancel solve attempt
    state = gameReducer(state, { type: "CANCEL_TOSS_UP_ATTEMPT" });
    expect(state.turnState).toBe("TOSSUP_REVEALING");
  });

  it("should not allow solving after cancel", () => {
    const puzzle = makePuzzle();

    // Start round
    let state = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle,
      seed: 42,
    });

    // Buzz in
    state = gameReducer(state, { type: "BUZZ_IN" });

    // Cancel
    state = gameReducer(state, { type: "CANCEL_TOSS_UP_ATTEMPT" });
    const stateAfterCancel = state;

    // Try to solve - should be ignored because we're not in TOSSUP_BUZZED anymore
    state = gameReducer(state, { type: "TOSS_UP_SOLVE_ATTEMPT", phrase: puzzle.phrase });
    expect(state).toEqual(stateAfterCancel); // State unchanged
  });

  it("should allow buzz in again after cancel", () => {
    const puzzle = makePuzzle();

    // Start round
    let state = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle,
      seed: 42,
    });

    // Buzz in, cancel, buzz in again
    state = gameReducer(state, { type: "BUZZ_IN" });
    state = gameReducer(state, { type: "CANCEL_TOSS_UP_ATTEMPT" });
    state = gameReducer(state, { type: "BUZZ_IN" });

    // Should be in TOSSUP_BUZZED
    expect(state.turnState).toBe("TOSSUP_BUZZED");
  });
});
