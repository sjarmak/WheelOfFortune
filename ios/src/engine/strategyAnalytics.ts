/**
 * Strategy Analytics Engine
 *
 * Analyzes puzzle packs to provide:
 * - Letter frequency analysis
 * - Category-specific insights
 * - Wheel probability calculations
 * - Strategy recommendations for Wheel of Fortune
 */

import { Puzzle, WHEEL_CONFIG, VOWELS, CONSONANTS } from './types';

export interface LetterFrequency {
  letter: string;
  occurrenceRate: number; // 0-100 percentage
  avgOccurrencesPerPuzzle: number;
  totalCount: number;
}

export interface CategoryAnalysis {
  category: string;
  letterFrequencies: LetterFrequency[];
  vowelRatio: number;
  commonPatterns: string[];
}

export interface WheelAnalysis {
  expectedValue: number;
  bankruptProbability: number;
  loseTurnProbability: number;
  freePlayProbability: number;
  cashProbability: number;
  avgCashValue: number;
}

export interface StrategyRecommendation {
  topConsonants: string[];
  topVowels: string[];
  optimalFirstGuesses: string[];
  categorySpecific: Map<string, string[]>;
  vowelBuyThreshold: number;
}

export interface PuzzleCorpusAnalytics {
  totalPuzzles: number;
  letterFrequencies: LetterFrequency[];
  categoryBreakdown: CategoryAnalysis[];
  recommendations: StrategyRecommendation;
  wheelAnalysis: WheelAnalysis;
}

/**
 * Calculate letter frequencies from an array of puzzles
 */
function calculateLetterFrequencies(puzzles: Puzzle[]): LetterFrequency[] {
  if (puzzles.length === 0) {
    return [];
  }

  const letterStats = new Map<string, { puzzleCount: number; totalCount: number }>();

  for (const puzzle of puzzles) {
    const phrase = puzzle.phrase.toUpperCase();
    const lettersInPuzzle = new Set<string>();

    for (const char of phrase) {
      if (/[A-Z]/.test(char)) {
        lettersInPuzzle.add(char);

        const current = letterStats.get(char) || { puzzleCount: 0, totalCount: 0 };
        letterStats.set(char, {
          ...current,
          totalCount: current.totalCount + 1
        });
      }
    }

    for (const letter of lettersInPuzzle) {
      const current = letterStats.get(letter)!;
      letterStats.set(letter, {
        ...current,
        puzzleCount: current.puzzleCount + 1
      });
    }
  }

  const frequencies: LetterFrequency[] = [];
  for (const [letter, stats] of letterStats.entries()) {
    frequencies.push({
      letter,
      occurrenceRate: (stats.puzzleCount / puzzles.length) * 100,
      avgOccurrencesPerPuzzle: stats.totalCount / stats.puzzleCount,
      totalCount: stats.totalCount
    });
  }

  return frequencies.sort((a, b) => {
    if (Math.abs(a.occurrenceRate - b.occurrenceRate) < 0.01) {
      return b.totalCount - a.totalCount;
    }
    return b.occurrenceRate - a.occurrenceRate;
  });
}

/**
 * Calculate category-specific analysis
 */
function calculateCategoryAnalysis(puzzles: Puzzle[]): CategoryAnalysis[] {
  const puzzlesByCategory = new Map<string, Puzzle[]>();

  for (const puzzle of puzzles) {
    const category = puzzle.category || 'UNKNOWN';
    const categoryPuzzles = puzzlesByCategory.get(category) || [];
    puzzlesByCategory.set(category, [...categoryPuzzles, puzzle]);
  }

  const analyses: CategoryAnalysis[] = [];

  for (const [category, categoryPuzzles] of puzzlesByCategory.entries()) {
    const letterFrequencies = calculateLetterFrequencies(categoryPuzzles);

    let vowelCount = 0;
    let consonantCount = 0;

    for (const puzzle of categoryPuzzles) {
      const phrase = puzzle.phrase.toUpperCase();
      for (const char of phrase) {
        if (/[A-Z]/.test(char)) {
          if (VOWELS.includes(char)) {
            vowelCount++;
          } else {
            consonantCount++;
          }
        }
      }
    }

    const vowelRatio = vowelCount / (vowelCount + consonantCount);

    const commonPatterns = findCommonPatterns(categoryPuzzles);

    analyses.push({
      category,
      letterFrequencies,
      vowelRatio,
      commonPatterns
    });
  }

  return analyses.sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Find common letter patterns in puzzles
 */
function findCommonPatterns(puzzles: Puzzle[]): string[] {
  const patternCounts = new Map<string, number>();
  const commonBigrams = ['TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ON', 'ES', 'ST', 'EN', 'AT', 'TO', 'NT', 'HA', 'ND', 'OU', 'EA', 'NG', 'AS'];
  const commonTrigrams = ['THE', 'AND', 'ING', 'ION', 'ENT', 'FOR', 'TIO', 'ERE', 'HER', 'ATE'];

  for (const puzzle of puzzles) {
    const phrase = puzzle.phrase.toUpperCase().replace(/[^A-Z]/g, '');

    for (const pattern of [...commonBigrams, ...commonTrigrams]) {
      if (phrase.includes(pattern)) {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      }
    }
  }

  const threshold = puzzles.length * 0.2;
  return Array.from(patternCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, _]) => pattern);
}

/**
 * Calculate wheel probability analysis
 * Uses iOS WHEEL_CONFIG with 'VALUE' type (not web's 'CASH')
 */
function calculateWheelAnalysis(): WheelAnalysis {
  const totalWedges = WHEEL_CONFIG.length;

  let cashWedges = 0;
  let bankruptWedges = 0;
  let loseTurnWedges = 0;
  let freePlayWedges = 0;
  let totalCashValue = 0;

  for (const wedge of WHEEL_CONFIG) {
    switch (wedge.type) {
      case 'VALUE':
        cashWedges++;
        totalCashValue += wedge.value;
        break;
      case 'BANKRUPT':
        bankruptWedges++;
        break;
      case 'LOSE_TURN':
        loseTurnWedges++;
        break;
      case 'FREE_PLAY':
        freePlayWedges++;
        break;
    }
  }

  const cashProbability = (cashWedges / totalWedges) * 100;
  const bankruptProbability = (bankruptWedges / totalWedges) * 100;
  const loseTurnProbability = (loseTurnWedges / totalWedges) * 100;
  const freePlayProbability = (freePlayWedges / totalWedges) * 100;

  const avgCashValue = totalCashValue / cashWedges;

  const expectedValue = totalCashValue / totalWedges;

  return {
    expectedValue,
    bankruptProbability,
    loseTurnProbability,
    freePlayProbability,
    cashProbability,
    avgCashValue
  };
}

/**
 * Generate strategy recommendations
 */
function generateRecommendations(
  letterFrequencies: LetterFrequency[],
  categoryBreakdown: CategoryAnalysis[]
): StrategyRecommendation {
  const consonantFreqs = letterFrequencies.filter(f => CONSONANTS.includes(f.letter));
  const vowelFreqs = letterFrequencies.filter(f => VOWELS.includes(f.letter));

  const topConsonants = consonantFreqs.slice(0, 5).map(f => f.letter);
  const topVowels = vowelFreqs.slice(0, 5).map(f => f.letter);

  const rstlne = ['R', 'S', 'T', 'L', 'N', 'E'];
  const rankedRSTLNE = rstlne.sort((a, b) => {
    const aFreq = letterFrequencies.find(f => f.letter === a);
    const bFreq = letterFrequencies.find(f => f.letter === b);
    return (bFreq?.occurrenceRate || 0) - (aFreq?.occurrenceRate || 0);
  });

  const categorySpecific = new Map<string, string[]>();
  for (const category of categoryBreakdown) {
    const topLetters = category.letterFrequencies
      .slice(0, 10)
      .map(f => f.letter);
    categorySpecific.set(category.category, topLetters);
  }

  const vowelBuyThreshold = 1000;

  return {
    topConsonants,
    topVowels,
    optimalFirstGuesses: rankedRSTLNE,
    categorySpecific,
    vowelBuyThreshold
  };
}

/**
 * Main analytics function
 * Analyzes a puzzle pack and returns comprehensive analytics
 */
export function analyzePuzzlePack(puzzles: Puzzle[]): PuzzleCorpusAnalytics {
  const letterFrequencies = calculateLetterFrequencies(puzzles);
  const categoryBreakdown = calculateCategoryAnalysis(puzzles);
  const wheelAnalysis = calculateWheelAnalysis();
  const recommendations = generateRecommendations(letterFrequencies, categoryBreakdown);

  return {
    totalPuzzles: puzzles.length,
    letterFrequencies,
    categoryBreakdown,
    recommendations,
    wheelAnalysis
  };
}
