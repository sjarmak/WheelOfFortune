import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE, GameAction } from "../engine/game";
import { GameState, Puzzle, VOWELS, CONSONANTS } from "../engine/types";

const SEED = 42;

const makeBonusPuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "bonus-1",
  phrase: "PRACTICE MAKES PERFECT",
  category: "PHRASE",
  round_type: "BONUS",
  ...overrides,
});

function startBonusRound(
  puzzle: Puzzle = makeBonusPuzzle(),
  seed: number = SEED,
): GameState {
  return gameReducer(INITIAL_STATE, {
    type: "START_ROUND",
    puzzle,
    seed,
  });
}

/** Get positions of RSTLNE letters in a phrase */
function getRSTLNEPositions(phrase: string): number[] {
  const RSTLNE = ["R", "S", "T", "L", "N", "E"];
  const positions: number[] = [];
  for (let i = 0; i < phrase.length; i++) {
    if (RSTLNE.includes(phrase[i].toUpperCase())) {
      positions.push(i);
    }
  }
  return positions;
}

describe("Bonus Engine: START_ROUND", () => {
  it("sets turnState to BONUS_PICKING for BONUS puzzles", () => {
    const state = startBonusRound();
    expect(state.turnState).toBe("BONUS_PICKING");
  });

  it("reveals RSTLNE positions on start", () => {
    const puzzle = makeBonusPuzzle();
    const state = startBonusRound(puzzle);
    const expectedPositions = getRSTLNEPositions(puzzle.phrase);
    expect(state.revealedPositions.sort()).toEqual(expectedPositions.sort());
  });

  it("adds RSTLNE to guessedLetters", () => {
    const state = startBonusRound();
    expect(state.guessedLetters.sort()).toEqual(
      ["E", "L", "N", "R", "S", "T"].sort(),
    );
  });

  it("resets bonusTimerMs to bonusTimerDurationMs", () => {
    const state = startBonusRound();
    expect(state.bonusTimerMs).toBe(state.bonusTimerDurationMs);
    expect(state.bonusTimerMs).toBe(20000);
  });

  it("resets roundResult to null", () => {
    const state = startBonusRound();
    expect(state.roundResult).toBeNull();
  });

  it("resets bonusPicks to empty", () => {
    const state = startBonusRound();
    expect(state.bonusPicks).toEqual([]);
  });
});

describe("Bonus Engine: BONUS_CHOOSE_LETTERS", () => {
  it("accepts valid 3 consonants + 1 vowel and transitions to BONUS_SOLVE_TIMER", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(next.turnState).toBe("BONUS_SOLVE_TIMER");
  });

  it("adds chosen letters to guessedLetters", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(next.guessedLetters).toContain("C");
    expect(next.guessedLetters).toContain("D");
    expect(next.guessedLetters).toContain("M");
    expect(next.guessedLetters).toContain("A");
    // RSTLNE should still be there
    expect(next.guessedLetters).toContain("R");
    expect(next.guessedLetters).toContain("S");
  });

  it("reveals correct positions for chosen letters", () => {
    // "PRACTICE MAKES PERFECT"
    // C at 5, 20 (PRACTI*C*E, PERFE*C*T)
    // D — not in phrase
    // M at 10 (*M*AKES)
    // A at 2, 12 (PR*A*CTICE, M*A*KES) — wait, index check
    const puzzle = makeBonusPuzzle();
    const state = startBonusRound(puzzle);
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });

    // Find expected positions for C, D, M, A in "PRACTICE MAKES PERFECT"
    const phrase = puzzle.phrase;
    const chosenLetters = ["C", "D", "M", "A"];
    const expectedNewPositions: number[] = [];
    for (let i = 0; i < phrase.length; i++) {
      if (chosenLetters.includes(phrase[i].toUpperCase())) {
        expectedNewPositions.push(i);
      }
    }

    // All positions for chosen letters should be revealed
    for (const pos of expectedNewPositions) {
      expect(next.revealedPositions).toContain(pos);
    }
  });

  it("sets bonusPicks to the chosen letters", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(next.bonusPicks).toEqual(["C", "D", "M", "A"]);
  });

  it("rejects RSTLNE consonants (R)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["R", "D", "M"],
      vowel: "A",
    });
    expect(next.turnState).toBe("BONUS_PICKING");
    expect(next).toBe(state);
  });

  it("rejects RSTLNE consonants (T)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "T", "M"],
      vowel: "A",
    });
    expect(next).toBe(state);
  });

  it("rejects RSTLNE vowel (E)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "E",
    });
    expect(next).toBe(state);
  });

  it("rejects duplicate consonants", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "C", "M"],
      vowel: "A",
    });
    expect(next).toBe(state);
  });

  it("rejects non-consonant in consonants slot (vowel in consonants)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["A", "D", "M"],
      vowel: "I",
    });
    expect(next).toBe(state);
  });

  it("rejects non-vowel in vowel slot (consonant as vowel)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "B",
    });
    expect(next).toBe(state);
  });

  it("rejects invalid characters (numbers)", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["1", "D", "M"],
      vowel: "A",
    });
    expect(next).toBe(state);
  });

  it("is a no-op when turnState is not BONUS_PICKING", () => {
    // Start a MAIN round (turnState = IDLE)
    const mainPuzzle: Puzzle = {
      id: "main-1",
      phrase: "HELLO",
      category: "PHRASE",
      round_type: "MAIN",
    };
    const state = gameReducer(INITIAL_STATE, {
      type: "START_ROUND",
      puzzle: mainPuzzle,
      seed: SEED,
    });
    expect(state.turnState).toBe("IDLE");
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(next).toBe(state);
  });

  it("handles case-insensitive letter input", () => {
    const state = startBonusRound();
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["c", "d", "m"],
      vowel: "a",
    });
    expect(next.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(next.bonusPicks).toEqual(["C", "D", "M", "A"]);
  });

  it("preserves RSTLNE positions when revealing chosen letters", () => {
    const puzzle = makeBonusPuzzle();
    const state = startBonusRound(puzzle);
    const rstlnePositions = getRSTLNEPositions(puzzle.phrase);

    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });

    // All original RSTLNE positions should still be revealed
    for (const pos of rstlnePositions) {
      expect(next.revealedPositions).toContain(pos);
    }
  });
});

/** Helper: start bonus round and choose letters to reach BONUS_SOLVE_TIMER */
function enterSolveTimer(
  puzzle: Puzzle = makeBonusPuzzle(),
  seed: number = SEED,
): GameState {
  const started = startBonusRound(puzzle, seed);
  return gameReducer(started, {
    type: "BONUS_CHOOSE_LETTERS",
    consonants: ["C", "D", "M"],
    vowel: "A",
  });
}

describe("Bonus Engine: BONUS_TICK", () => {
  it("decrements bonusTimerMs correctly", () => {
    const state = enterSolveTimer();
    expect(state.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(state.bonusTimerMs).toBe(20000);

    const next = gameReducer(state, { type: "BONUS_TICK", dtMs: 1000 });
    expect(next.bonusTimerMs).toBe(19000);
    expect(next.turnState).toBe("BONUS_SOLVE_TIMER");
  });

  it("expires timer and ends round as loss when bonusTimerMs reaches 0", () => {
    const state = enterSolveTimer();
    const next = gameReducer(state, { type: "BONUS_TICK", dtMs: 20000 });
    expect(next.bonusTimerMs).toBe(0);
    expect(next.turnState).toBe("ROUND_OVER");
    expect(next.roundResult).toBe("loss");
    // All positions revealed
    const allPositions = Array.from(
      { length: state.currentPuzzle!.phrase.length },
      (_, i) => i,
    );
    expect(next.revealedPositions.sort()).toEqual(allPositions.sort());
  });

  it("expires timer when dtMs exceeds remaining time", () => {
    const state = enterSolveTimer();
    const next = gameReducer(state, { type: "BONUS_TICK", dtMs: 25000 });
    expect(next.bonusTimerMs).toBe(0);
    expect(next.turnState).toBe("ROUND_OVER");
    expect(next.roundResult).toBe("loss");
  });

  it("is a no-op when turnState is not BONUS_SOLVE_TIMER", () => {
    const state = startBonusRound();
    expect(state.turnState).toBe("BONUS_PICKING");
    const next = gameReducer(state, { type: "BONUS_TICK", dtMs: 1000 });
    expect(next).toBe(state);
  });

  it("is a no-op when turnState is ROUND_OVER", () => {
    const state = enterSolveTimer();
    // Expire the timer
    const expired = gameReducer(state, { type: "BONUS_TICK", dtMs: 20000 });
    expect(expired.turnState).toBe("ROUND_OVER");
    const next = gameReducer(expired, { type: "BONUS_TICK", dtMs: 1000 });
    expect(next).toBe(expired);
  });

  it("accumulates multiple small ticks correctly", () => {
    let state = enterSolveTimer();
    state = gameReducer(state, { type: "BONUS_TICK", dtMs: 5000 });
    expect(state.bonusTimerMs).toBe(15000);
    state = gameReducer(state, { type: "BONUS_TICK", dtMs: 5000 });
    expect(state.bonusTimerMs).toBe(10000);
    state = gameReducer(state, { type: "BONUS_TICK", dtMs: 5000 });
    expect(state.bonusTimerMs).toBe(5000);
    state = gameReducer(state, { type: "BONUS_TICK", dtMs: 5000 });
    expect(state.bonusTimerMs).toBe(0);
    expect(state.turnState).toBe("ROUND_OVER");
    expect(state.roundResult).toBe("loss");
  });
});

describe("Bonus Engine: BONUS_SOLVE_ATTEMPT", () => {
  it("correct solve during timer ends round as win", () => {
    const puzzle = makeBonusPuzzle();
    const state = enterSolveTimer(puzzle);
    const next = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(next.turnState).toBe("ROUND_OVER");
    expect(next.roundResult).toBe("win");
    // All positions revealed
    const allPositions = Array.from(
      { length: puzzle.phrase.length },
      (_, i) => i,
    );
    expect(next.revealedPositions.sort()).toEqual(allPositions.sort());
  });

  it("correct solve is case-insensitive", () => {
    const state = enterSolveTimer();
    const next = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "practice makes perfect",
    });
    expect(next.turnState).toBe("ROUND_OVER");
    expect(next.roundResult).toBe("win");
  });

  it("wrong solve returns state unchanged (allows retry)", () => {
    const state = enterSolveTimer();
    const next = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "WRONG ANSWER",
    });
    expect(next).toBe(state);
    expect(next.turnState).toBe("BONUS_SOLVE_TIMER");
  });

  it("allows multiple retries after wrong solve", () => {
    const state = enterSolveTimer();
    const after1 = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "WRONG",
    });
    expect(after1).toBe(state);
    const after2 = gameReducer(after1, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "ALSO WRONG",
    });
    expect(after2).toBe(state);
    // Still can solve correctly
    const after3 = gameReducer(after2, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(after3.turnState).toBe("ROUND_OVER");
    expect(after3.roundResult).toBe("win");
  });

  it("is a no-op when turnState is not BONUS_SOLVE_TIMER", () => {
    const state = startBonusRound();
    expect(state.turnState).toBe("BONUS_PICKING");
    const next = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(next).toBe(state);
  });

  it("is a no-op when turnState is ROUND_OVER", () => {
    const state = enterSolveTimer();
    const won = gameReducer(state, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(won.turnState).toBe("ROUND_OVER");
    const next = gameReducer(won, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(next).toBe(won);
  });
});
