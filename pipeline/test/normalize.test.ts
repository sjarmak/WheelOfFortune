import { describe, it, expect } from 'vitest';
import {
  normalizePhrase,
  generateDedupeKey,
  extractLetters,
  countWords,
  calculateVowelRatio,
  countUniqueLetters,
  countRareLetters,
  validatePhrase,
} from '../src/normalize/phrase.js';

describe('normalizePhrase', () => {
  it('converts to uppercase', () => {
    expect(normalizePhrase('hello world')).toBe('HELLO WORLD');
  });

  it('preserves allowed punctuation', () => {
    expect(normalizePhrase("it's a test!")).toBe("IT'S A TEST!");
    expect(normalizePhrase('rock & roll')).toBe('ROCK & ROLL');
    expect(normalizePhrase('yes, no, maybe')).toBe('YES, NO, MAYBE');
  });

  it('converts fancy quotes to ASCII', () => {
    expect(normalizePhrase("it\u2019s fancy")).toBe("IT'S FANCY");
    expect(normalizePhrase("\u201Cquoted\u201D")).toBe('QUOTED');
  });

  it('converts dashes to hyphens', () => {
    expect(normalizePhrase("well\u2014known")).toBe('WELL-KNOWN');
    expect(normalizePhrase("semi\u2013colon")).toBe('SEMI-COLON');
  });

  it('collapses whitespace', () => {
    expect(normalizePhrase('too   many    spaces')).toBe('TOO MANY SPACES');
    expect(normalizePhrase('  leading and trailing  ')).toBe('LEADING AND TRAILING');
  });

  it('removes non-allowed characters', () => {
    expect(normalizePhrase('hello@world#test')).toBe('HELLOWORLDTEST');
  });
});

describe('generateDedupeKey', () => {
  it('removes all non-letters', () => {
    expect(generateDedupeKey("IT'S A TEST!")).toBe('ITSATEST');
    expect(generateDedupeKey('ROCK & ROLL')).toBe('ROCKROLL');
  });

  it('is case-insensitive', () => {
    expect(generateDedupeKey('Hello World')).toBe('HELLOWORLD');
  });

  it('treats different punctuation as same', () => {
    const key1 = generateDedupeKey('IT IS A TEST');
    const key2 = generateDedupeKey("IT'S A TEST");
    // These are different phrases, different keys
    expect(key1).not.toBe(key2);
  });
});

describe('extractLetters', () => {
  it('extracts only A-Z', () => {
    expect(extractLetters('HELLO WORLD!')).toEqual(['H', 'E', 'L', 'L', 'O', 'W', 'O', 'R', 'L', 'D']);
  });

  it('returns empty for no letters', () => {
    expect(extractLetters('123 !@#')).toEqual([]);
  });
});

describe('countWords', () => {
  it('counts words correctly', () => {
    expect(countWords('HELLO WORLD')).toBe(2);
    expect(countWords('ONE')).toBe(1);
    expect(countWords('A B C D E')).toBe(5);
  });

  it('handles extra spaces', () => {
    expect(countWords('  TOO   MANY  SPACES  ')).toBe(3);
  });
});

describe('calculateVowelRatio', () => {
  it('calculates correctly', () => {
    expect(calculateVowelRatio(['A', 'E', 'I', 'O', 'U'])).toBe(1);
    expect(calculateVowelRatio(['B', 'C', 'D'])).toBe(0);
    expect(calculateVowelRatio(['A', 'B'])).toBe(0.5);
  });

  it('handles empty', () => {
    expect(calculateVowelRatio([])).toBe(0);
  });
});

describe('countUniqueLetters', () => {
  it('counts unique letters', () => {
    expect(countUniqueLetters(['A', 'B', 'A', 'C', 'B'])).toBe(3);
    expect(countUniqueLetters(['A', 'A', 'A'])).toBe(1);
  });
});

describe('countRareLetters', () => {
  it('counts J, Q, X, Z', () => {
    expect(countRareLetters(['J', 'A', 'Z', 'Z'])).toBe(3);
    expect(countRareLetters(['A', 'B', 'C'])).toBe(0);
    expect(countRareLetters(['Q', 'X'])).toBe(2);
  });
});

describe('validatePhrase', () => {
  it('rejects too few letters', () => {
    const result = validatePhrase('AB');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('too_few_letters');
  });

  it('accepts valid phrases', () => {
    expect(validatePhrase('HELLO WORLD').valid).toBe(true);
  });

  it('rejects header-like content', () => {
    expect(validatePhrase('CATEGORY').valid).toBe(false);
    expect(validatePhrase('null').valid).toBe(false);
  });

  it('rejects too long phrases', () => {
    const long = 'A'.repeat(150);
    expect(validatePhrase(long).valid).toBe(false);
  });
});
