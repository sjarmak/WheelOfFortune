import { describe, it, expect } from 'vitest';
import {
  analyzePuzzlePack,
  LetterFrequency,
  CategoryAnalysis,
  WheelAnalysis,
  StrategyRecommendation,
  PuzzleCorpusAnalytics
} from '../strategyAnalytics';
import { Puzzle } from '../types';

describe('strategyAnalytics', () => {
  describe('analyzePuzzlePack', () => {
    it('should calculate letter frequencies correctly for a simple dataset', () => {
      const puzzles: Puzzle[] = [
        {
          id: '1',
          phrase: 'TEST',
          category: 'TEST',
          round_type: 'MAIN'
        },
        {
          id: '2',
          phrase: 'BEST',
          category: 'TEST',
          round_type: 'MAIN'
        }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      // Both puzzles contain: E, S, T, B (from BEST)
      // T appears in both (100% occurrence rate)
      // E appears in both (100% occurrence rate)
      // S appears in both (100% occurrence rate)
      // B appears in 1 (50% occurrence rate)

      expect(analytics.totalPuzzles).toBe(2);
      expect(analytics.letterFrequencies).toBeDefined();
      expect(analytics.letterFrequencies.length).toBeGreaterThan(0);

      // Find T frequency
      const tFreq = analytics.letterFrequencies.find(f => f.letter === 'T');
      expect(tFreq).toBeDefined();
      expect(tFreq?.occurrenceRate).toBe(100); // T in both puzzles
      expect(tFreq?.avgOccurrencesPerPuzzle).toBe(1.5); // T: 2 in TEST, 1 in BEST = 3/2 = 1.5

      // Find B frequency
      const bFreq = analytics.letterFrequencies.find(f => f.letter === 'B');
      expect(bFreq).toBeDefined();
      expect(bFreq?.occurrenceRate).toBe(50); // B in 1 of 2 puzzles
    });

    it('should calculate occurrence rates as percentages', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'AAA', category: 'TEST', round_type: 'MAIN' },
        { id: '2', phrase: 'BBB', category: 'TEST', round_type: 'MAIN' },
        { id: '3', phrase: 'AAA', category: 'TEST', round_type: 'MAIN' },
        { id: '4', phrase: 'CCC', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      const aFreq = analytics.letterFrequencies.find(f => f.letter === 'A');
      expect(aFreq?.occurrenceRate).toBe(50); // A in 2 of 4 puzzles = 50%

      const bFreq = analytics.letterFrequencies.find(f => f.letter === 'B');
      expect(bFreq?.occurrenceRate).toBe(25); // B in 1 of 4 puzzles = 25%
    });

    it('should sort letter frequencies by occurrence rate (highest first)', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'AAA', category: 'TEST', round_type: 'MAIN' },
        { id: '2', phrase: 'AAB', category: 'TEST', round_type: 'MAIN' },
        { id: '3', phrase: 'AAC', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      // A should be first (100% occurrence)
      expect(analytics.letterFrequencies[0].letter).toBe('A');
      expect(analytics.letterFrequencies[0].occurrenceRate).toBe(100);
    });

    it('should calculate category-specific analysis', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'TEST', category: 'CATEGORY_A', round_type: 'MAIN' },
        { id: '2', phrase: 'BEST', category: 'CATEGORY_A', round_type: 'MAIN' },
        { id: '3', phrase: 'REST', category: 'CATEGORY_B', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      expect(analytics.categoryBreakdown).toBeDefined();
      expect(analytics.categoryBreakdown.length).toBe(2);

      const catA = analytics.categoryBreakdown.find(c => c.category === 'CATEGORY_A');
      expect(catA).toBeDefined();
      expect(catA?.letterFrequencies).toBeDefined();
    });

    it('should calculate wheel probability analysis', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'TEST', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      expect(analytics.wheelAnalysis).toBeDefined();
      expect(analytics.wheelAnalysis.cashProbability).toBeCloseTo(83.33, 1); // 20/24 ≈ 83.33%
      expect(analytics.wheelAnalysis.bankruptProbability).toBeCloseTo(8.33, 1); // 2/24 ≈ 8.33%
      expect(analytics.wheelAnalysis.loseTurnProbability).toBeCloseTo(4.17, 1); // 1/24 ≈ 4.17%
      expect(analytics.wheelAnalysis.freePlayProbability).toBeCloseTo(4.17, 1); // 1/24 ≈ 4.17%
      expect(analytics.wheelAnalysis.expectedValue).toBeGreaterThan(0);
      expect(analytics.wheelAnalysis.avgCashValue).toBeGreaterThan(0);
    });

    it('should provide strategy recommendations', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'THE BEST REST', category: 'TEST', round_type: 'MAIN' },
        { id: '2', phrase: 'THE REST TEST', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      expect(analytics.recommendations).toBeDefined();
      expect(analytics.recommendations.topConsonants).toBeDefined();
      expect(analytics.recommendations.topConsonants.length).toBeGreaterThan(0);
      expect(analytics.recommendations.topVowels).toBeDefined();
      expect(analytics.recommendations.topVowels.length).toBeGreaterThan(0);
      expect(analytics.recommendations.optimalFirstGuesses).toBeDefined();
      expect(analytics.recommendations.optimalFirstGuesses.length).toBeGreaterThan(0);
    });

    it('should handle empty puzzle array', () => {
      const puzzles: Puzzle[] = [];

      const analytics = analyzePuzzlePack(puzzles);

      expect(analytics.totalPuzzles).toBe(0);
      expect(analytics.letterFrequencies.length).toBe(0);
    });

    it('should only count letters A-Z, ignoring spaces and punctuation', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'A-B C!', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      // Should only have A, B, C
      expect(analytics.letterFrequencies.length).toBe(3);
      expect(analytics.letterFrequencies.every(f => /^[A-Z]$/.test(f.letter))).toBe(true);
    });

    it('should be case-insensitive', () => {
      const puzzles: Puzzle[] = [
        { id: '1', phrase: 'test', category: 'TEST', round_type: 'MAIN' },
        { id: '2', phrase: 'TEST', category: 'TEST', round_type: 'MAIN' }
      ];

      const analytics = analyzePuzzlePack(puzzles);

      const tFreq = analytics.letterFrequencies.find(f => f.letter === 'T');
      expect(tFreq?.occurrenceRate).toBe(100);
      expect(tFreq?.totalCount).toBe(4); // 2 from each puzzle
    });
  });
});
