import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE, GameAction } from "../engine/game";
import { GameState, Puzzle } from "../engine/types";
import { SeededRNG } from "../engine/rng";

const SEED = 42;

const makeTossUpPuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "tossup-1",
  phrase: "HELLO WORLD",
  category: "PHRASE",
  round_type: "TOSSUP",
  ...overrides,
});

/** Compute the expected reveal order for a puzzle with a given seed */
function expectedRevealOrder(phrase: string, seed: number): number[] {
  const positions = Array.from({ length: phrase.length }, (_, i) => i);
  const letterPositions = positions.filter((i) => /[A-Z]/.test(phrase[i]));
  const rng = new SeededRNG(seed);
  return rng.shuffle(letterPositions);
}

function startTossUpRound(
  puzzle: Puzzle = makeTossUpPuzzle(),
  seed: number = SEED,
): GameState {
  return gameReducer(INITIAL_STATE, {
    type: "START_ROUND",
    puzzle,
    seed,
  });
}

describe("Toss-Up Engine: START_ROUND", () => {
  it("sets turnState to TOSSUP_REVEALING for TOSSUP puzzles", () => {
    const state = startTossUpRound();
    expect(state.turnState).toBe("TOSSUP_REVEALING");
  });

  it("initializes tossUpRevealOrder with seeded shuffle of letter positions", () => {
    const puzzle = makeTossUpPuzzle();
    const state = startTossUpRound(puzzle);
    const expected = expectedRevealOrder(puzzle.phrase, SEED);
    expect(state.tossUpRevealOrder).toEqual(expected);
  });

  it("starts with tossUpIndex 0 and tossUpElapsedMs 0", () => {
    const state = startTossUpRound();
    expect(state.tossUpIndex).toBe(0);
    expect(state.tossUpElapsedMs).toBe(0);
  });

  it("starts with no revealed positions", () => {
    const state = startTossUpRound();
    expect(state.revealedPositions).toEqual([]);
  });

  it("sets roundResult to null", () => {
    const state = startTossUpRound();
    expect(state.roundResult).toBeNull();
  });

  it("still sets turnState to IDLE for MAIN puzzles", () => {
    const puzzle: Puzzle = {
      id: "main-1",
      phrase: "HELLO WORLD",
      category: "PHRASE",
      round_type: "MAIN",
    };
    const state = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle,
      seed: SEED,
    });
    expect(state.turnState).toBe("IDLE");
  });
});

describe("Toss-Up Engine: TOSS_UP_TICK reveal cadence", () => {
  it("does not reveal a letter before 1000ms has elapsed", () => {
    const state = startTossUpRound();
    const ticked = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 500 });

    expect(ticked.tossUpElapsedMs).toBe(500);
    expect(ticked.tossUpIndex).toBe(0);
    expect(ticked.revealedPositions).toEqual([]);
  });

  it("reveals first letter at exactly 1000ms", () => {
    const state = startTossUpRound();
    const ticked = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });

    expect(ticked.tossUpIndex).toBe(1);
    expect(ticked.revealedPositions).toEqual([
      state.tossUpRevealOrder[0],
    ]);
    expect(ticked.tossUpElapsedMs).toBe(0);
  });

  it("accumulates partial ticks correctly", () => {
    let state = startTossUpRound();

    // Tick 600ms — not enough
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 600 });
    expect(state.tossUpIndex).toBe(0);
    expect(state.tossUpElapsedMs).toBe(600);

    // Tick another 600ms (total 1200ms) — reveals 1 letter, 200ms remainder
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 600 });
    expect(state.tossUpIndex).toBe(1);
    expect(state.tossUpElapsedMs).toBe(200);
  });

  it("reveals multiple letters with large dtMs", () => {
    const state = startTossUpRound();
    const ticked = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 3000 });

    expect(ticked.tossUpIndex).toBe(3);
    expect(ticked.revealedPositions).toHaveLength(3);
    expect(ticked.tossUpElapsedMs).toBe(0);
  });

  it("reveals 5 letters with dtMs=5000 when interval=1000", () => {
    const state = startTossUpRound();
    const ticked = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 5000 });

    expect(ticked.tossUpIndex).toBe(5);
    expect(ticked.revealedPositions).toHaveLength(5);
    expect(ticked.tossUpElapsedMs).toBe(0);
    // Verify each revealed position matches the seeded reveal order
    for (let i = 0; i < 5; i++) {
      expect(ticked.revealedPositions[i]).toBe(state.tossUpRevealOrder[i]);
    }
  });

  it("reveals all letters and ends round as loss with huge dtMs on short puzzle", () => {
    const shortPuzzle = makeTossUpPuzzle({ phrase: "HI" }); // 2 letters
    const state = startTossUpRound(shortPuzzle);
    const totalLetters = state.tossUpRevealOrder.length;
    expect(totalLetters).toBe(2);

    // Dispatch dtMs far exceeding what's needed to reveal all letters
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 50000 });

    expect(result.turnState).toBe("ROUND_OVER");
    expect(result.roundResult).toBe("loss");
    expect(result.tossUpIndex).toBe(totalLetters);
    // All positions revealed (both characters)
    expect(result.revealedPositions).toHaveLength(shortPuzzle.phrase.length);
    for (let i = 0; i < shortPuzzle.phrase.length; i++) {
      expect(result.revealedPositions).toContain(i);
    }
  });

  it("reveal order matches seeded shuffle", () => {
    const puzzle = makeTossUpPuzzle();
    const expected = expectedRevealOrder(puzzle.phrase, SEED);
    let state = startTossUpRound(puzzle);

    // Reveal letters one by one (stop before last, since last triggers ROUND_OVER)
    for (let i = 0; i < expected.length - 1; i++) {
      state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
      expect(state.revealedPositions[i]).toBe(expected[i]);
      expect(state.turnState).toBe("TOSSUP_REVEALING");
    }

    // Last letter triggers ROUND_OVER with all positions revealed
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(state.turnState).toBe("ROUND_OVER");
    // Verify that all expected positions are in the revealed set
    for (const pos of expected) {
      expect(state.revealedPositions).toContain(pos);
    }
  });
});

describe("Toss-Up Engine: round end on full reveal", () => {
  it("sets turnState to ROUND_OVER and roundResult to loss when all letters revealed", () => {
    const puzzle = makeTossUpPuzzle();
    const revealOrder = expectedRevealOrder(puzzle.phrase, SEED);
    const totalLetters = revealOrder.length;

    const state = startTossUpRound(puzzle);
    // Tick enough to reveal all letters
    const result = gameReducer(state, {
      type: "TOSS_UP_TICK",
      dtMs: totalLetters * 1000,
    });

    expect(result.turnState).toBe("ROUND_OVER");
    expect(result.roundResult).toBe("loss");
  });

  it("reveals all positions (including spaces) on round over", () => {
    const puzzle = makeTossUpPuzzle(); // "HELLO WORLD" = 11 chars
    const revealOrder = expectedRevealOrder(puzzle.phrase, SEED);
    const state = startTossUpRound(puzzle);
    const result = gameReducer(state, {
      type: "TOSS_UP_TICK",
      dtMs: revealOrder.length * 1000,
    });

    // All positions revealed (including space at index 5)
    expect(result.revealedPositions).toHaveLength(puzzle.phrase.length);
    for (let i = 0; i < puzzle.phrase.length; i++) {
      expect(result.revealedPositions).toContain(i);
    }
  });
});

describe("Toss-Up Engine: TOSS_UP_TICK no-op cases", () => {
  it("is a no-op when turnState is TOSSUP_BUZZED", () => {
    const state = {
      ...startTossUpRound(),
      turnState: "TOSSUP_BUZZED" as const,
    };
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is IDLE", () => {
    const state = { ...startTossUpRound(), turnState: "IDLE" as const };
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is ROUND_OVER", () => {
    const state = {
      ...startTossUpRound(),
      turnState: "ROUND_OVER" as const,
    };
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(result).toBe(state);
  });
});

describe("Toss-Up Engine: TOSSUP_LOCKED_OUT tick handling", () => {
  it("decrements tossUpLockoutMs during lockout", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_LOCKED_OUT",
      tossUpLockoutMs: 3000,
    };
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(result.turnState).toBe("TOSSUP_LOCKED_OUT");
    expect(result.tossUpLockoutMs).toBe(2000);
  });

  it("transitions back to TOSSUP_REVEALING when lockout expires", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_LOCKED_OUT",
      tossUpLockoutMs: 3000,
    };
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 3000 });
    expect(result.turnState).toBe("TOSSUP_REVEALING");
    expect(result.tossUpLockoutMs).toBe(0);
  });

  it("applies leftover time as reveal ticks after lockout expires", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_LOCKED_OUT",
      tossUpLockoutMs: 500,
      tossUpElapsedMs: 0,
    };
    // 500ms clears lockout, 1000ms of leftover reveals 1 letter
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1500 });
    expect(result.turnState).toBe("TOSSUP_REVEALING");
    expect(result.tossUpLockoutMs).toBe(0);
    expect(result.tossUpIndex).toBe(1);
  });

  it("applies large leftover time after lockout, revealing multiple letters", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_LOCKED_OUT",
      tossUpLockoutMs: 500,
      tossUpElapsedMs: 0,
    };
    // 500ms clears lockout, 3000ms leftover reveals 3 letters
    const result = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 3500 });
    expect(result.turnState).toBe("TOSSUP_REVEALING");
    expect(result.tossUpLockoutMs).toBe(0);
    expect(result.tossUpIndex).toBe(3);
    expect(result.revealedPositions).toHaveLength(3);
  });
});

describe("Toss-Up Engine: BUZZ_IN", () => {
  it("pauses reveal by setting turnState to TOSSUP_BUZZED", () => {
    const state = startTossUpRound();
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    const buzzed = gameReducer(state, { type: "BUZZ_IN" });
    expect(buzzed.turnState).toBe("TOSSUP_BUZZED");
  });

  it("preserves all other state when buzzing in", () => {
    let state = startTossUpRound();
    // Reveal a letter first
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(state.tossUpIndex).toBe(1);

    const buzzed = gameReducer(state, { type: "BUZZ_IN" });
    expect(buzzed.turnState).toBe("TOSSUP_BUZZED");
    expect(buzzed.tossUpIndex).toBe(1);
    expect(buzzed.revealedPositions).toEqual(state.revealedPositions);
    expect(buzzed.tossUpElapsedMs).toBe(state.tossUpElapsedMs);
  });

  it("is a no-op when turnState is TOSSUP_LOCKED_OUT", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_LOCKED_OUT",
      tossUpLockoutMs: 3000,
    };
    const result = gameReducer(state, { type: "BUZZ_IN" });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is TOSSUP_BUZZED", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "TOSSUP_BUZZED",
    };
    const result = gameReducer(state, { type: "BUZZ_IN" });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is IDLE", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "IDLE",
    };
    const result = gameReducer(state, { type: "BUZZ_IN" });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is ROUND_OVER", () => {
    const state: GameState = {
      ...startTossUpRound(),
      turnState: "ROUND_OVER",
    };
    const result = gameReducer(state, { type: "BUZZ_IN" });
    expect(result).toBe(state);
  });
});

describe("Toss-Up Engine: TOSS_UP_SOLVE_ATTEMPT", () => {
  it("correct solve ends round as win", () => {
    const puzzle = makeTossUpPuzzle(); // "HELLO WORLD"
    let state = startTossUpRound(puzzle);
    state = gameReducer(state, { type: "BUZZ_IN" });
    expect(state.turnState).toBe("TOSSUP_BUZZED");

    const result = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "hello world",
    });
    expect(result.turnState).toBe("ROUND_OVER");
    expect(result.roundResult).toBe("win");
    // All positions revealed
    expect(result.revealedPositions).toHaveLength(puzzle.phrase.length);
    for (let i = 0; i < puzzle.phrase.length; i++) {
      expect(result.revealedPositions).toContain(i);
    }
  });

  it("correct solve is case-insensitive", () => {
    const puzzle = makeTossUpPuzzle();
    let state = startTossUpRound(puzzle);
    state = gameReducer(state, { type: "BUZZ_IN" });

    const result = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "HeLLo WoRLd",
    });
    expect(result.turnState).toBe("ROUND_OVER");
    expect(result.roundResult).toBe("win");
  });

  it("wrong solve triggers lockout", () => {
    let state = startTossUpRound();
    state = gameReducer(state, { type: "BUZZ_IN" });

    const result = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "WRONG ANSWER",
    });
    expect(result.turnState).toBe("TOSSUP_LOCKED_OUT");
    expect(result.tossUpLockoutMs).toBe(3000);
  });

  it("lockout expires after 3000ms of ticks and resumes revealing", () => {
    let state = startTossUpRound();
    // Buzz in and solve incorrectly
    state = gameReducer(state, { type: "BUZZ_IN" });
    state = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "WRONG",
    });
    expect(state.turnState).toBe("TOSSUP_LOCKED_OUT");
    expect(state.tossUpLockoutMs).toBe(3000);

    // Tick through lockout
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 3000 });
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpLockoutMs).toBe(0);
  });

  it("cannot buzz during lockout", () => {
    let state = startTossUpRound();
    state = gameReducer(state, { type: "BUZZ_IN" });
    state = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "WRONG",
    });
    expect(state.turnState).toBe("TOSSUP_LOCKED_OUT");

    const result = gameReducer(state, { type: "BUZZ_IN" });
    expect(result).toBe(state);
  });

  it("is a no-op when turnState is not TOSSUP_BUZZED", () => {
    const state = startTossUpRound();
    expect(state.turnState).toBe("TOSSUP_REVEALING");

    const result = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "HELLO WORLD",
    });
    expect(result).toBe(state);
  });
});

describe("Toss-Up Engine: end-to-end simulation — wrong solve, lockout, correct solve win", () => {
  const SIMULATION_SEED = 42;
  const puzzle = makeTossUpPuzzle({ phrase: "HELLO WORLD" });

  it("full round: tick reveals -> buzz -> wrong solve -> lockout -> resume -> buzz -> correct solve -> win", () => {
    const revealOrder = expectedRevealOrder(puzzle.phrase, SIMULATION_SEED);

    // Step 1: Start round
    let state = startTossUpRound(puzzle, SIMULATION_SEED);
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpIndex).toBe(0);
    expect(state.revealedPositions).toHaveLength(0);
    expect(state.roundResult).toBeNull();

    // Step 2: Tick to reveal 3 letters (3000ms)
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 3000 });
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpIndex).toBe(3);
    expect(state.revealedPositions).toHaveLength(3);
    expect(state.revealedPositions).toEqual([
      revealOrder[0],
      revealOrder[1],
      revealOrder[2],
    ]);
    expect(state.roundResult).toBeNull();

    // Step 3: Buzz in
    state = gameReducer(state, { type: "BUZZ_IN" });
    expect(state.turnState).toBe("TOSSUP_BUZZED");
    expect(state.tossUpIndex).toBe(3);
    expect(state.revealedPositions).toHaveLength(3);

    // Step 4: Wrong solve attempt
    state = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "WRONG GUESS",
    });
    expect(state.turnState).toBe("TOSSUP_LOCKED_OUT");
    expect(state.tossUpLockoutMs).toBe(3000);
    expect(state.tossUpIndex).toBe(3);
    expect(state.revealedPositions).toHaveLength(3);
    expect(state.roundResult).toBeNull();

    // Step 5: Tick through half the lockout (1500ms)
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1500 });
    expect(state.turnState).toBe("TOSSUP_LOCKED_OUT");
    expect(state.tossUpLockoutMs).toBe(1500);
    // No new reveals during lockout
    expect(state.tossUpIndex).toBe(3);
    expect(state.revealedPositions).toHaveLength(3);

    // Step 6: Tick remaining lockout (1500ms) — lockout expires, resumes revealing
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1500 });
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpLockoutMs).toBe(0);
    // No extra reveals since leftover time is 0ms (exactly at boundary)
    expect(state.tossUpIndex).toBe(3);

    // Step 7: Tick to reveal 1 more letter (1000ms)
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpIndex).toBe(4);
    expect(state.revealedPositions).toHaveLength(4);
    expect(state.revealedPositions[3]).toBe(revealOrder[3]);

    // Step 8: Buzz in again
    state = gameReducer(state, { type: "BUZZ_IN" });
    expect(state.turnState).toBe("TOSSUP_BUZZED");
    expect(state.tossUpIndex).toBe(4);

    // Step 9: Correct solve
    state = gameReducer(state, {
      type: "TOSS_UP_SOLVE_ATTEMPT",
      phrase: "hello world",
    });
    expect(state.turnState).toBe("ROUND_OVER");
    expect(state.roundResult).toBe("win");
    // All positions revealed (including space at index 5)
    expect(state.revealedPositions).toHaveLength(puzzle.phrase.length);
    for (let i = 0; i < puzzle.phrase.length; i++) {
      expect(state.revealedPositions).toContain(i);
    }
  });
});

describe("Toss-Up Engine: end-to-end simulation — all letters revealed, loss", () => {
  const SIMULATION_SEED = 42;
  const puzzle = makeTossUpPuzzle({ phrase: "HELLO WORLD" });

  it("full round: tick all letters revealed -> round over as loss", () => {
    const revealOrder = expectedRevealOrder(puzzle.phrase, SIMULATION_SEED);
    const totalLetters = revealOrder.length; // 10 letters in "HELLO WORLD"

    // Step 1: Start round
    let state = startTossUpRound(puzzle, SIMULATION_SEED);
    expect(state.turnState).toBe("TOSSUP_REVEALING");
    expect(state.tossUpIndex).toBe(0);
    expect(state.revealedPositions).toHaveLength(0);
    expect(state.roundResult).toBeNull();
    expect(state.tossUpRevealOrder).toEqual(revealOrder);

    // Step 2: Tick letters one by one, verifying each intermediate state
    for (let i = 0; i < totalLetters - 1; i++) {
      state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
      expect(state.turnState).toBe("TOSSUP_REVEALING");
      expect(state.tossUpIndex).toBe(i + 1);
      expect(state.revealedPositions).toHaveLength(i + 1);
      expect(state.revealedPositions[i]).toBe(revealOrder[i]);
      expect(state.roundResult).toBeNull();
    }

    // Step 3: Last letter reveal — round ends as loss
    state = gameReducer(state, { type: "TOSS_UP_TICK", dtMs: 1000 });
    expect(state.turnState).toBe("ROUND_OVER");
    expect(state.roundResult).toBe("loss");
    expect(state.tossUpIndex).toBe(totalLetters);

    // All positions revealed (including non-letter positions like the space)
    expect(state.revealedPositions).toHaveLength(puzzle.phrase.length);
    for (let i = 0; i < puzzle.phrase.length; i++) {
      expect(state.revealedPositions).toContain(i);
    }
    // Verify all original reveal order positions are present
    for (const pos of revealOrder) {
      expect(state.revealedPositions).toContain(pos);
    }
  });
});
