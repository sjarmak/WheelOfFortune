import { describe, it, expect } from 'vitest';
import { computeDifficulty } from '../src/difficulty.js';

describe('computeDifficulty', () => {
  it('returns score between 0 and 1', () => {
    const result = computeDifficulty('HELLO WORLD');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('short phrases are easier', () => {
    const short = computeDifficulty('CAT');
    const long = computeDifficulty('SUPERCALIFRAGILISTICEXPIALIDOCIOUS');
    expect(short.score).toBeLessThan(long.score);
  });

  it('phrases with rare letters are harder', () => {
    const normal = computeDifficulty('HELLO WORLD');
    const withRare = computeDifficulty('HELLO WORLD JAZZ QUIZ');
    expect(withRare.score).toBeGreaterThan(normal.score);
    // JAZZ has J, Z, Z and QUIZ has Q, Z = 5 rare letters total
    expect(withRare.reasons.some(r => r.startsWith('rare_letters_count:'))).toBe(true);
  });

  it('flags long phrases', () => {
    const long = computeDifficulty('THIS IS A VERY LONG PHRASE WITH MANY WORDS');
    expect(long.reasons).toContain('long_phrase');
  });

  it('flags phrases ending in ING', () => {
    const result = computeDifficulty('RUNNING');
    expect(result.reasons).toContain('ends_in_ing');
  });

  it('handles edge cases', () => {
    expect(() => computeDifficulty('')).not.toThrow();
    expect(() => computeDifficulty('A')).not.toThrow();
  });
});
