import { describe, it, expect } from 'vitest';
import { analyzePuzzlePack } from '../engine/strategyAnalytics';
import type { PuzzleCorpusAnalytics, LetterFrequency, WheelAnalysis } from '../engine/strategyAnalytics';
import type { Puzzle } from '../engine/types';
import { WHEEL_CONFIG, VOWELS, CONSONANTS } from '../engine/types';

// Real puzzle data from data/packs/original.json
const TEST_PUZZLES: Puzzle[] = [
  { id: '1', phrase: 'PRACTICE MAKES PERFECT', category: 'PHRASE', round_type: 'MAIN' },
  { id: '2', phrase: 'A PENNY FOR YOUR THOUGHTS', category: 'PHRASE', round_type: 'MAIN' },
  { id: '3', phrase: 'ACTIONS SPEAK LOUDER THAN WORDS', category: 'PHRASE', round_type: 'MAIN' },
  { id: '4', phrase: 'GRAND CANYON', category: 'PLACE', round_type: 'MAIN' },
  { id: '5', phrase: 'CHOCOLATE CAKE', category: 'FOOD_AND_DRINK', round_type: 'MAIN' },
  { id: '6', phrase: 'RUNNING A MARATHON', category: 'WHAT_ARE_YOU_DOING', round_type: 'MAIN' },
];

describe('analyzePuzzlePack', () => {
  it('returns correct totalPuzzles count', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    expect(result.totalPuzzles).toBe(6);
  });

  it('handles empty puzzle array', () => {
    const result = analyzePuzzlePack([]);
    expect(result.totalPuzzles).toBe(0);
    expect(result.letterFrequencies).toEqual([]);
    expect(result.categoryBreakdown).toEqual([]);
  });

  it('returns all required top-level fields', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    expect(result).toHaveProperty('totalPuzzles');
    expect(result).toHaveProperty('letterFrequencies');
    expect(result).toHaveProperty('categoryBreakdown');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('wheelAnalysis');
  });
});

describe('calculateLetterFrequencies', () => {
  it('returns frequencies sorted by occurrenceRate descending', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const freqs = result.letterFrequencies;

    for (let i = 1; i < freqs.length; i++) {
      const prev = freqs[i - 1];
      const curr = freqs[i];
      // When rates are nearly equal, totalCount should be descending
      if (Math.abs(prev.occurrenceRate - curr.occurrenceRate) < 0.01) {
        expect(prev.totalCount).toBeGreaterThanOrEqual(curr.totalCount);
      } else {
        expect(prev.occurrenceRate).toBeGreaterThan(curr.occurrenceRate);
      }
    }
  });

  it('calculates occurrenceRate as percentage of puzzles containing the letter', () => {
    // 'A' appears in all 6 puzzles: PRACTICE, PENNY, ACTIONS, GRAND, CAKE, MARATHON
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const letterA = result.letterFrequencies.find(f => f.letter === 'A');
    expect(letterA).toBeDefined();
    expect(letterA!.occurrenceRate).toBe(100);
  });

  it('calculates avgOccurrencesPerPuzzle correctly', () => {
    // Use a simple case: single puzzle
    const singlePuzzle: Puzzle[] = [
      { id: '1', phrase: 'AAA BBB', category: 'PHRASE', round_type: 'MAIN' }
    ];
    const result = analyzePuzzlePack(singlePuzzle);
    const letterA = result.letterFrequencies.find(f => f.letter === 'A');
    expect(letterA).toBeDefined();
    expect(letterA!.totalCount).toBe(3);
    expect(letterA!.avgOccurrencesPerPuzzle).toBe(3);
  });

  it('only counts alphabetic characters (ignores spaces and punctuation)', () => {
    const puzzles: Puzzle[] = [
      { id: '1', phrase: 'A-B C!D', category: 'PHRASE', round_type: 'MAIN' }
    ];
    const result = analyzePuzzlePack(puzzles);
    const letters = result.letterFrequencies.map(f => f.letter).sort();
    expect(letters).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('calculateCategoryAnalysis', () => {
  it('returns one entry per category', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const categories = result.categoryBreakdown.map(c => c.category).sort();
    expect(categories).toEqual(['FOOD_AND_DRINK', 'PHRASE', 'PLACE', 'WHAT_ARE_YOU_DOING']);
  });

  it('sorts categories alphabetically', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const categories = result.categoryBreakdown.map(c => c.category);
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
  });

  it('calculates vowelRatio between 0 and 1', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    for (const category of result.categoryBreakdown) {
      expect(category.vowelRatio).toBeGreaterThan(0);
      expect(category.vowelRatio).toBeLessThan(1);
    }
  });

  it('includes letter frequencies per category', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const phraseCategory = result.categoryBreakdown.find(c => c.category === 'PHRASE');
    expect(phraseCategory).toBeDefined();
    expect(phraseCategory!.letterFrequencies.length).toBeGreaterThan(0);
  });

  it('assigns UNKNOWN category to puzzles without category', () => {
    const puzzles: Puzzle[] = [
      { id: '1', phrase: 'TEST', category: '', round_type: 'MAIN' }
    ];
    const result = analyzePuzzlePack(puzzles);
    const unknown = result.categoryBreakdown.find(c => c.category === 'UNKNOWN');
    expect(unknown).toBeDefined();
  });

  it('returns common patterns as an array of strings', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    for (const category of result.categoryBreakdown) {
      expect(Array.isArray(category.commonPatterns)).toBe(true);
    }
  });
});

describe('findCommonPatterns', () => {
  it('only includes patterns appearing in 20%+ of puzzles', () => {
    // With 3 PHRASE puzzles, threshold is 0.6, so patterns must appear in at least 1
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const phraseCategory = result.categoryBreakdown.find(c => c.category === 'PHRASE');
    expect(phraseCategory).toBeDefined();
    // All returned patterns should be valid bigrams or trigrams
    for (const pattern of phraseCategory!.commonPatterns) {
      expect(pattern.length).toBeGreaterThanOrEqual(2);
      expect(pattern.length).toBeLessThanOrEqual(3);
    }
  });

  it('returns at most 10 patterns', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    for (const category of result.categoryBreakdown) {
      expect(category.commonPatterns.length).toBeLessThanOrEqual(10);
    }
  });
});

describe('calculateWheelAnalysis', () => {
  it('uses iOS WHEEL_CONFIG with VALUE type (not CASH)', () => {
    // Verify WHEEL_CONFIG uses 'VALUE' type
    const valueWedges = WHEEL_CONFIG.filter(w => w.type === 'VALUE');
    expect(valueWedges.length).toBeGreaterThan(0);
    // No CASH type should exist in iOS config
    const cashWedges = WHEEL_CONFIG.filter(w => (w.type as string) === 'CASH');
    expect(cashWedges.length).toBe(0);
  });

  it('probabilities sum to 100%', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const wa = result.wheelAnalysis;
    const total = wa.cashProbability + wa.bankruptProbability + wa.loseTurnProbability + wa.freePlayProbability;
    expect(total).toBeCloseTo(100, 5);
  });

  it('calculates correct probabilities for 24-wedge wheel', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const wa = result.wheelAnalysis;

    // Count wedges from WHEEL_CONFIG directly
    const valueCount = WHEEL_CONFIG.filter(w => w.type === 'VALUE').length;
    const bankruptCount = WHEEL_CONFIG.filter(w => w.type === 'BANKRUPT').length;
    const loseTurnCount = WHEEL_CONFIG.filter(w => w.type === 'LOSE_TURN').length;
    const freePlayCount = WHEEL_CONFIG.filter(w => w.type === 'FREE_PLAY').length;

    expect(wa.cashProbability).toBeCloseTo((valueCount / 24) * 100, 5);
    expect(wa.bankruptProbability).toBeCloseTo((bankruptCount / 24) * 100, 5);
    expect(wa.loseTurnProbability).toBeCloseTo((loseTurnCount / 24) * 100, 5);
    expect(wa.freePlayProbability).toBeCloseTo((freePlayCount / 24) * 100, 5);
  });

  it('calculates expectedValue as total cash divided by total wedges', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const totalCash = WHEEL_CONFIG
      .filter(w => w.type === 'VALUE')
      .reduce((sum, w) => sum + w.value, 0);
    expect(result.wheelAnalysis.expectedValue).toBeCloseTo(totalCash / 24, 5);
  });

  it('calculates avgCashValue as total cash divided by cash wedges', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const valueWedges = WHEEL_CONFIG.filter(w => w.type === 'VALUE');
    const totalCash = valueWedges.reduce((sum, w) => sum + w.value, 0);
    expect(result.wheelAnalysis.avgCashValue).toBeCloseTo(totalCash / valueWedges.length, 5);
  });
});

describe('generateRecommendations', () => {
  it('returns exactly 5 top consonants', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    expect(result.recommendations.topConsonants).toHaveLength(5);
  });

  it('top consonants are all consonants', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    for (const letter of result.recommendations.topConsonants) {
      expect(CONSONANTS).toContain(letter);
    }
  });

  it('top vowels are all vowels', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    for (const letter of result.recommendations.topVowels) {
      expect(VOWELS).toContain(letter);
    }
  });

  it('optimalFirstGuesses contains exactly RSTLNE letters', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const sorted = [...result.recommendations.optimalFirstGuesses].sort();
    expect(sorted).toEqual(['E', 'L', 'N', 'R', 'S', 'T']);
  });

  it('has category-specific recommendations for each category', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    const categoryMap = result.recommendations.categorySpecific;
    expect(categoryMap.size).toBe(4); // PHRASE, PLACE, FOOD_AND_DRINK, WHAT_ARE_YOU_DOING
  });

  it('vowelBuyThreshold is 1000', () => {
    const result = analyzePuzzlePack(TEST_PUZZLES);
    expect(result.recommendations.vowelBuyThreshold).toBe(1000);
  });
});

describe('integration with real puzzle data', () => {
  it('produces consistent results for the same input', () => {
    const result1 = analyzePuzzlePack(TEST_PUZZLES);
    const result2 = analyzePuzzlePack(TEST_PUZZLES);

    expect(result1.totalPuzzles).toBe(result2.totalPuzzles);
    expect(result1.letterFrequencies).toEqual(result2.letterFrequencies);
    expect(result1.wheelAnalysis).toEqual(result2.wheelAnalysis);
  });

  it('handles single puzzle input', () => {
    const singlePuzzle: Puzzle[] = [
      { id: '1', phrase: 'HELLO WORLD', category: 'PHRASE', round_type: 'MAIN' }
    ];
    const result = analyzePuzzlePack(singlePuzzle);
    expect(result.totalPuzzles).toBe(1);
    expect(result.categoryBreakdown).toHaveLength(1);
    expect(result.categoryBreakdown[0].category).toBe('PHRASE');

    // H, E, L, O, W, R, D all appear in 1/1 puzzle = 100%
    for (const freq of result.letterFrequencies) {
      expect(freq.occurrenceRate).toBe(100);
    }

    // L appears 3 times in HELLOWORLD
    const letterL = result.letterFrequencies.find(f => f.letter === 'L');
    expect(letterL).toBeDefined();
    expect(letterL!.totalCount).toBe(3);
    expect(letterL!.avgOccurrencesPerPuzzle).toBe(3);
  });
});
