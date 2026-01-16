import { describe, it, expect } from 'vitest';
import { getPhonicsChunks, getVowelHints } from '../engine/phonics';

const SAMPLE_PHRASE = 'CAT ON THE MAT';

describe('getPhonicsChunks', () => {
  it('finds word families and digraphs in the phrase', () => {
    const chunks = getPhonicsChunks(SAMPLE_PHRASE);
    const family = chunks.find(chunk => chunk.chunk === 'AT');
    expect(family).toBeDefined();
    expect(family?.words).toContain('CAT');

    const digraphs = getPhonicsChunks('SHIP CHOO CHOO');
    expect(digraphs.some(chunk => chunk.chunk === 'SH')).toBe(true);
    expect(digraphs.some(chunk => chunk.chunk === 'CH')).toBe(true);
  });
});

describe('getVowelHints', () => {
  it('returns vowel hints ordered by frequency', () => {
    const hints = getVowelHints('LOOK AT A BOOK');
    expect(hints[0].vowel).toBe('O');
    expect(hints.map(h => h.vowel)).toContain('A');
  });

  it('respects the requested limit', () => {
    const hints = getVowelHints('AEIOU AEIOU', 2);
    expect(hints).toHaveLength(2);
  });
});
