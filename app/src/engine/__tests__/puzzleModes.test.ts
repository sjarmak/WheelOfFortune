import { describe, it, expect } from "vitest";
import { getPuzzlesForMode } from "../packs";
import { Puzzle, RoundType } from "../types";

const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "puzzle-1",
  phrase: "HELLO WORLD",
  category: "Phrase",
  round_type: "MAIN",
  ...overrides,
});

describe("getPuzzlesForMode — round_type filtering", () => {
  it("returns only MAIN puzzles for MAIN mode", () => {
    const puzzles: Puzzle[] = [
      makePuzzle({ id: "p1", round_type: "MAIN" }),
      makePuzzle({ id: "p2", round_type: "TOSSUP" }),
      makePuzzle({ id: "p3", round_type: "BONUS" }),
    ];

    const result = getPuzzlesForMode(puzzles, "MAIN");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });

  it("returns only TOSSUP puzzles for TOSSUP mode", () => {
    const puzzles: Puzzle[] = [
      makePuzzle({ id: "p1", round_type: "MAIN" }),
      makePuzzle({ id: "p2", round_type: "TOSSUP" }),
      makePuzzle({ id: "p3", round_type: "BONUS" }),
    ];

    const result = getPuzzlesForMode(puzzles, "TOSSUP");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2");
  });

  it("returns only BONUS puzzles for BONUS mode", () => {
    const puzzles: Puzzle[] = [
      makePuzzle({ id: "p1", round_type: "MAIN" }),
      makePuzzle({ id: "p2", round_type: "TOSSUP" }),
      makePuzzle({ id: "p3", round_type: "BONUS" }),
    ];

    const result = getPuzzlesForMode(puzzles, "BONUS");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p3");
  });

  it("returns empty array when no puzzles match the mode", () => {
    const puzzles: Puzzle[] = [makePuzzle({ id: "p1", round_type: "MAIN" })];

    expect(getPuzzlesForMode(puzzles, "TOSSUP")).toHaveLength(0);
    expect(getPuzzlesForMode(puzzles, "BONUS")).toHaveLength(0);
  });

  it("returns multiple puzzles of the same round_type", () => {
    const puzzles: Puzzle[] = [
      makePuzzle({ id: "p1", round_type: "BONUS" }),
      makePuzzle({ id: "p2", round_type: "BONUS" }),
      makePuzzle({ id: "p3", round_type: "MAIN" }),
      makePuzzle({ id: "p4", round_type: "BONUS" }),
    ];

    const result = getPuzzlesForMode(puzzles, "BONUS");
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p4"]);
  });

  describe("legacy puzzles without round_type", () => {
    it("legacy puzzles default to MAIN mode", () => {
      const puzzle = makePuzzle({ id: "legacy-1" });
      delete (puzzle as any).round_type;

      expect(getPuzzlesForMode([puzzle], "MAIN")).toHaveLength(1);
    });

    it("legacy puzzles are excluded from TOSSUP and BONUS", () => {
      const puzzle = makePuzzle({ id: "legacy-1" });
      delete (puzzle as any).round_type;

      expect(getPuzzlesForMode([puzzle], "TOSSUP")).toHaveLength(0);
      expect(getPuzzlesForMode([puzzle], "BONUS")).toHaveLength(0);
    });
  });

  describe("mixed pack filtering", () => {
    it("correctly partitions a mixed pack by mode", () => {
      const puzzles: Puzzle[] = [
        makePuzzle({ id: "m1", round_type: "MAIN" }),
        makePuzzle({ id: "m2", round_type: "MAIN" }),
        makePuzzle({ id: "t1", round_type: "TOSSUP" }),
        makePuzzle({ id: "t2", round_type: "TOSSUP" }),
        makePuzzle({ id: "t3", round_type: "TOSSUP" }),
        makePuzzle({ id: "b1", round_type: "BONUS" }),
      ];

      expect(getPuzzlesForMode(puzzles, "MAIN")).toHaveLength(2);
      expect(getPuzzlesForMode(puzzles, "TOSSUP")).toHaveLength(3);
      expect(getPuzzlesForMode(puzzles, "BONUS")).toHaveLength(1);
    });
  });
});
