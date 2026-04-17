import { describe, test, expect } from 'vitest';
import { getPuzzlesForMode } from '../packs';
import { Puzzle } from '../types';

describe('getPuzzlesForMode', () => {
  const mainPuzzle: Puzzle = {
    id: 'm1',
    phrase: 'HELLO WORLD',
    category: 'PHRASE',
    round_type: 'MAIN',
  };

  const tossUpPuzzle: Puzzle = {
    id: 't1',
    phrase: 'QUICK FOX',
    category: 'PHRASE',
    round_type: 'TOSSUP',
  };

  const bonusPuzzle: Puzzle = {
    id: 'b1',
    phrase: 'BONUS ROUND',
    category: 'PHRASE',
    round_type: 'BONUS',
  };

  // Legacy puzzle with no round_type — treated as MAIN
  const legacyPuzzle = {
    id: 'L1',
    phrase: 'LEGACY PUZZLE',
    category: 'PHRASE',
    // no round_type
  } as Puzzle;

  test('returns only puzzles with round_type === MAIN', () => {
    const input = [mainPuzzle, tossUpPuzzle, bonusPuzzle];
    const result = getPuzzlesForMode(input, 'MAIN');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('m1');
    expect(result.every(p => p.round_type === 'MAIN')).toBe(true);
  });

  test('treats missing round_type as MAIN', () => {
    const input = [legacyPuzzle, tossUpPuzzle, bonusPuzzle];
    const result = getPuzzlesForMode(input, 'MAIN');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('L1');
  });

  test('excludes TOSSUP and BONUS puzzles from MAIN filter', () => {
    const input = [mainPuzzle, tossUpPuzzle, bonusPuzzle, legacyPuzzle];
    const result = getPuzzlesForMode(input, 'MAIN');

    expect(result.find(p => p.round_type === 'TOSSUP')).toBeUndefined();
    expect(result.find(p => p.round_type === 'BONUS')).toBeUndefined();
    expect(result).toHaveLength(2); // mainPuzzle + legacyPuzzle (no round_type)
  });

  test('returns only TOSSUP puzzles when mode is TOSSUP', () => {
    const input = [mainPuzzle, tossUpPuzzle, bonusPuzzle];
    const result = getPuzzlesForMode(input, 'TOSSUP');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  test('returns only BONUS puzzles when mode is BONUS', () => {
    const input = [mainPuzzle, tossUpPuzzle, bonusPuzzle];
    const result = getPuzzlesForMode(input, 'BONUS');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b1');
  });

  test('returns empty array for empty input', () => {
    expect(getPuzzlesForMode([], 'MAIN')).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const input = [mainPuzzle, tossUpPuzzle, bonusPuzzle];
    const snapshot = [...input];
    getPuzzlesForMode(input, 'MAIN');
    expect(input).toEqual(snapshot);
  });
});
