import { describe, it, expect } from 'vitest';
import { generatePuzzleId, deduplicatePuzzles } from '../src/dedupe.js';

describe('generatePuzzleId', () => {
  it('generates consistent IDs', () => {
    const id1 = generatePuzzleId('HELLO WORLD', 'PHRASE', 'MAIN');
    const id2 = generatePuzzleId('HELLO WORLD', 'PHRASE', 'MAIN');
    expect(id1).toBe(id2);
  });

  it('generates different IDs for different categories', () => {
    const id1 = generatePuzzleId('HELLO WORLD', 'PHRASE', 'MAIN');
    const id2 = generatePuzzleId('HELLO WORLD', 'THING', 'MAIN');
    expect(id1).not.toBe(id2);
  });

  it('generates different IDs for different round types', () => {
    const id1 = generatePuzzleId('HELLO WORLD', 'PHRASE', 'MAIN');
    const id2 = generatePuzzleId('HELLO WORLD', 'PHRASE', 'BONUS');
    expect(id1).not.toBe(id2);
  });

  it('normalizes punctuation differences', () => {
    const id1 = generatePuzzleId("IT'S A TEST", 'PHRASE', 'MAIN');
    const id2 = generatePuzzleId('ITS A TEST', 'PHRASE', 'MAIN');
    // Same dedupe key = same ID
    expect(id1).toBe(id2);
  });
});

describe('deduplicatePuzzles', () => {
  it('removes duplicates', () => {
    const puzzles = [
      { phrase: 'HELLO WORLD' },
      { phrase: 'GOODBYE' },
      { phrase: 'HELLO WORLD' }, // duplicate
    ];
    
    const { unique, duplicatesRemoved } = deduplicatePuzzles(puzzles);
    expect(unique.length).toBe(2);
    expect(duplicatesRemoved).toBe(1);
  });

  it('treats different punctuation as different', () => {
    const puzzles = [
      { phrase: "IT'S A TEST" },
      { phrase: 'IT IS A TEST' },
    ];
    
    const { unique, duplicatesRemoved } = deduplicatePuzzles(puzzles);
    expect(unique.length).toBe(2);
    expect(duplicatesRemoved).toBe(0);
  });

  it('keeps first occurrence', () => {
    const puzzles = [
      { phrase: 'HELLO', extra: 'first' },
      { phrase: 'HELLO', extra: 'second' },
    ];
    
    const { unique } = deduplicatePuzzles(puzzles);
    expect(unique[0].extra).toBe('first');
  });
});
