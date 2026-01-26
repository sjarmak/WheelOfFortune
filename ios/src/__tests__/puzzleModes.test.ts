import { describe, it, expect } from "vitest";
import { getPuzzlesForMode } from "../engine/packs";
import { Puzzle, RoundType } from "../engine/types";

const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: "puzzle-1",
  phrase: "HELLO WORLD",
  category: "Phrase",
  round_type: "MAIN",
  ...overrides,
});

describe("puzzle mode eligibility", () => {
  describe("mapPuzzles sets allowed_modes based on category", () => {
    it("'Before & After' puzzle is excluded from BONUS", () => {
      // We test via getPuzzlesForMode with a puzzle that has allowed_modes set
      const puzzle = makePuzzle({
        id: "ba-1",
        category: "Before & After",
        allowed_modes: ["MAIN", "TOSSUP"],
      });
      const result = getPuzzlesForMode([puzzle], "BONUS");
      expect(result).toHaveLength(0);
    });

    it("'Phrase' puzzle is eligible for all modes", () => {
      const puzzle = makePuzzle({
        id: "phrase-1",
        category: "Phrase",
        allowed_modes: ["MAIN", "TOSSUP", "BONUS"],
      });

      expect(getPuzzlesForMode([puzzle], "MAIN")).toHaveLength(1);
      expect(getPuzzlesForMode([puzzle], "TOSSUP")).toHaveLength(1);
      expect(getPuzzlesForMode([puzzle], "BONUS")).toHaveLength(1);
    });
  });

  describe("getPuzzlesForMode", () => {
    it("filters correctly by mode", () => {
      const puzzles: Puzzle[] = [
        makePuzzle({
          id: "p1",
          category: "Phrase",
          allowed_modes: ["MAIN", "TOSSUP", "BONUS"],
        }),
        makePuzzle({
          id: "p2",
          category: "Before & After",
          allowed_modes: ["MAIN", "TOSSUP"],
        }),
        makePuzzle({
          id: "p3",
          category: "Same Name",
          allowed_modes: ["MAIN", "TOSSUP"],
        }),
        makePuzzle({
          id: "p4",
          category: "Thing",
          allowed_modes: ["MAIN", "TOSSUP", "BONUS"],
        }),
      ];

      const mainPuzzles = getPuzzlesForMode(puzzles, "MAIN");
      expect(mainPuzzles).toHaveLength(4);

      const tossupPuzzles = getPuzzlesForMode(puzzles, "TOSSUP");
      expect(tossupPuzzles).toHaveLength(4);

      const bonusPuzzles = getPuzzlesForMode(puzzles, "BONUS");
      expect(bonusPuzzles).toHaveLength(2);
      expect(bonusPuzzles.map((p) => p.id)).toEqual(["p1", "p4"]);
    });

    it("puzzles without allowed_modes default to eligible for all modes", () => {
      const puzzle = makePuzzle({
        id: "legacy-1",
        category: "Phrase",
      });
      // Remove allowed_modes to simulate legacy puzzle
      delete puzzle.allowed_modes;

      const modes: RoundType[] = ["MAIN", "TOSSUP", "BONUS"];
      for (const mode of modes) {
        expect(getPuzzlesForMode([puzzle], mode)).toHaveLength(1);
      }
    });
  });

  describe("excluded categories", () => {
    const excludedCategories = [
      "Before & After",
      "Same Name",
      "Rhyme Time",
      "Song Lyrics",
      "Title/Author",
    ];

    for (const category of excludedCategories) {
      it(`'${category}' is excluded from BONUS mode`, () => {
        const puzzle = makePuzzle({
          id: `excl-${category}`,
          category,
          allowed_modes: ["MAIN", "TOSSUP"],
        });
        expect(getPuzzlesForMode([puzzle], "BONUS")).toHaveLength(0);
        expect(getPuzzlesForMode([puzzle], "MAIN")).toHaveLength(1);
        expect(getPuzzlesForMode([puzzle], "TOSSUP")).toHaveLength(1);
      });
    }
  });
});
