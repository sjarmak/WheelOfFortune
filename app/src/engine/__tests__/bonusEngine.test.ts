import { describe, it, expect } from "vitest";
import { gameReducer, INITIAL_STATE, GameAction } from "../game";
import { GameState, Puzzle, VOWELS, CONSONANTS } from "../types";

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
    const puzzle = makeBonusPuzzle();
    const state = startBonusRound(puzzle);
    const next = gameReducer(state, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });

    const phrase = puzzle.phrase;
    const chosenLetters = ["C", "D", "M", "A"];
    const expectedNewPositions: number[] = [];
    for (let i = 0; i < phrase.length; i++) {
      if (chosenLetters.includes(phrase[i].toUpperCase())) {
        expectedNewPositions.push(i);
      }
    }

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

describe("Bonus Engine: end-to-end simulation", () => {
  // "PRACTICE MAKES PERFECT"
  //  P R A C T I C E   M A  K  E  S     P  E  R  F  E  C  T
  //  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21
  //
  // RSTLNE positions: R(1,17), S(13), T(4,21), E(7,12,16,19)  → [1,4,7,12,13,16,17,19,21]

  const RSTLNE_POSITIONS = [1, 4, 7, 12, 13, 16, 17, 19, 21];

  it("simulation: start → RSTLNE → pick letters → partial timer → correct solve → win", () => {
    const puzzle = makeBonusPuzzle();

    const s1 = startBonusRound(puzzle);
    expect(s1.turnState).toBe("BONUS_PICKING");
    expect(s1.guessedLetters.sort()).toEqual(
      ["E", "L", "N", "R", "S", "T"].sort(),
    );
    expect(s1.revealedPositions.sort()).toEqual(RSTLNE_POSITIONS.sort());
    expect(s1.roundResult).toBeNull();
    expect(s1.bonusTimerMs).toBe(20000);
    expect(s1.bonusPicks).toEqual([]);

    const s2 = gameReducer(s1, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(s2.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(s2.bonusPicks).toEqual(["C", "D", "M", "A"]);
    expect(s2.guessedLetters).toContain("C");
    expect(s2.guessedLetters).toContain("D");
    expect(s2.guessedLetters).toContain("M");
    expect(s2.guessedLetters).toContain("A");

    const chosenPositions = [2, 3, 6, 9, 10, 20];
    const expectedRevealedAfterPick = [...RSTLNE_POSITIONS, ...chosenPositions];
    expect(s2.revealedPositions.sort()).toEqual(
      expectedRevealedAfterPick.sort(),
    );

    const allPositions = Array.from({ length: puzzle.phrase.length }, (_, i) => i);
    const unrevealed = allPositions.filter(
      (p) => !s2.revealedPositions.includes(p),
    );
    expect(unrevealed.sort()).toEqual([0, 5, 8, 11, 14, 15, 18].sort());

    const s3 = gameReducer(s2, { type: "BONUS_TICK", dtMs: 10000 });
    expect(s3.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(s3.bonusTimerMs).toBe(10000);
    expect(s3.roundResult).toBeNull();

    const s4 = gameReducer(s3, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(s4.turnState).toBe("ROUND_OVER");
    expect(s4.roundResult).toBe("win");
    expect(s4.revealedPositions.sort()).toEqual(allPositions.sort());
  });

  it("simulation: start → RSTLNE → pick letters → timer expiry → loss", () => {
    const puzzle = makeBonusPuzzle();

    const s1 = startBonusRound(puzzle);
    expect(s1.turnState).toBe("BONUS_PICKING");

    const s2 = gameReducer(s1, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(s2.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(s2.bonusTimerMs).toBe(20000);

    const s3a = gameReducer(s2, { type: "BONUS_TICK", dtMs: 8000 });
    expect(s3a.bonusTimerMs).toBe(12000);
    expect(s3a.turnState).toBe("BONUS_SOLVE_TIMER");

    const s3b = gameReducer(s3a, { type: "BONUS_TICK", dtMs: 7000 });
    expect(s3b.bonusTimerMs).toBe(5000);
    expect(s3b.turnState).toBe("BONUS_SOLVE_TIMER");

    const s4 = gameReducer(s3b, { type: "BONUS_TICK", dtMs: 5000 });
    expect(s4.bonusTimerMs).toBe(0);
    expect(s4.turnState).toBe("ROUND_OVER");
    expect(s4.roundResult).toBe("loss");

    const allPositions = Array.from({ length: puzzle.phrase.length }, (_, i) => i);
    expect(s4.revealedPositions.sort()).toEqual(allPositions.sort());

    const s5a = gameReducer(s4, { type: "BONUS_TICK", dtMs: 1000 });
    expect(s5a).toBe(s4);

    const s5b = gameReducer(s4, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(s5b).toBe(s4);
  });

  it("simulation: start → pick letters → wrong solve → retry correct → win", () => {
    const puzzle = makeBonusPuzzle();

    const s1 = startBonusRound(puzzle);
    const s2 = gameReducer(s1, {
      type: "BONUS_CHOOSE_LETTERS",
      consonants: ["C", "D", "M"],
      vowel: "A",
    });
    expect(s2.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(s2.bonusTimerMs).toBe(20000);

    const s3 = gameReducer(s2, { type: "BONUS_TICK", dtMs: 3000 });
    expect(s3.bonusTimerMs).toBe(17000);

    const s4 = gameReducer(s3, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PROGRESS",
    });
    expect(s4).toBe(s3);
    expect(s4.turnState).toBe("BONUS_SOLVE_TIMER");
    expect(s4.bonusTimerMs).toBe(17000);
    expect(s4.roundResult).toBeNull();

    const s5 = gameReducer(s4, { type: "BONUS_TICK", dtMs: 5000 });
    expect(s5.bonusTimerMs).toBe(12000);

    const s6 = gameReducer(s5, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "TOTALLY WRONG",
    });
    expect(s6).toBe(s5);
    expect(s6.turnState).toBe("BONUS_SOLVE_TIMER");

    const s7 = gameReducer(s6, {
      type: "BONUS_SOLVE_ATTEMPT",
      phrase: "PRACTICE MAKES PERFECT",
    });
    expect(s7.turnState).toBe("ROUND_OVER");
    expect(s7.roundResult).toBe("win");
    expect(s7.bonusTimerMs).toBe(12000);

    const allPositions = Array.from({ length: puzzle.phrase.length }, (_, i) => i);
    expect(s7.revealedPositions.sort()).toEqual(allPositions.sort());
  });
});
