/**
 * Letter Suggestions Helper
 *
 * Suggests good letters for kids to guess based on:
 * - High frequency letters in English (E, T, A, O, I, N, S, R)
 * - Letters that actually exist in the puzzle
 * - Excluding already guessed letters
 */

import { SeededRNG } from './rng';

/** Letter frequency ranking (higher = more common in English) */
const LETTER_FREQUENCY: Record<string, number> = {
  E: 12, T: 11, A: 10, O: 9, I: 8, N: 8,
  S: 7, H: 6, R: 6, D: 5, L: 5, C: 4,
  U: 4, M: 3, W: 3, F: 3, G: 3, Y: 3,
  P: 2, B: 2, V: 2, K: 1, J: 1, X: 1,
  Q: 0, Z: 0
};

/** Vowels for vowel-specific suggestions */
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export interface LetterSuggestion {
  letter: string;
  inPuzzle: boolean;  // Whether letter is in the puzzle
  score: number;      // Ranking score
}

/**
 * Get suggested letters for "Choose for me" helper.
 *
 * @param phrase - The puzzle phrase
 * @param guessedLetters - Already guessed letters
 * @param revealedPositions - Positions already revealed
 * @param count - Number of suggestions (default 3)
 * @param seed - RNG seed for determinism
 * @param vowelsOnly - Only suggest vowels
 * @returns Array of suggested letters
 */
export function getSuggestedLetters(
  phrase: string,
  guessedLetters: string[],
  revealedPositions: number[],
  count: number = 3,
  seed?: number,
  vowelsOnly: boolean = false
): string[] {
  const guessedSet = new Set(guessedLetters.map(l => l.toUpperCase()));
  const upperPhrase = phrase.toUpperCase();

  // Find letters in the puzzle that haven't been guessed yet
  const unrevealed = new Set<string>();
  for (let i = 0; i < upperPhrase.length; i++) {
    const char = upperPhrase[i];
    if (/[A-Z]/.test(char) && !revealedPositions.includes(i)) {
      unrevealed.add(char);
    }
  }

  // Build candidate list with scores
  const candidates: LetterSuggestion[] = [];

  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    // Skip if already guessed
    if (guessedSet.has(letter)) continue;

    // Filter by vowel requirement
    if (vowelsOnly && !VOWELS.has(letter)) continue;
    if (!vowelsOnly && VOWELS.has(letter)) continue; // Usually suggest consonants

    const inPuzzle = unrevealed.has(letter);
    const frequencyScore = LETTER_FREQUENCY[letter] || 0;

    // Boost score significantly if letter is in puzzle
    const score = frequencyScore + (inPuzzle ? 50 : 0);

    candidates.push({ letter, inPuzzle, score });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Use seeded RNG for slight randomization among top candidates
  const rng = seed !== undefined ? new SeededRNG(seed) : null;

  // Take more candidates than needed for shuffling
  const topCandidates = candidates.slice(0, Math.min(count * 2, candidates.length));

  // Slight shuffle of top candidates for variety
  if (rng && topCandidates.length > count) {
    for (let i = topCandidates.length - 1; i > 0; i--) {
      // Only shuffle among similar-scored items
      const j = rng.range(Math.max(0, i - 2), i + 1);
      [topCandidates[i], topCandidates[j]] = [topCandidates[j], topCandidates[i]];
    }
  }

  // Ensure at least one letter is in the puzzle if possible
  const finalSuggestions: string[] = [];
  const inPuzzleSuggestions = topCandidates.filter(c => c.inPuzzle);
  const notInPuzzleSuggestions = topCandidates.filter(c => !c.inPuzzle);

  // Add at least one that's in the puzzle
  if (inPuzzleSuggestions.length > 0) {
    finalSuggestions.push(inPuzzleSuggestions[0].letter);
    inPuzzleSuggestions.shift();
  }

  // Fill remaining from top candidates
  const remaining = [...inPuzzleSuggestions, ...notInPuzzleSuggestions];
  for (const candidate of remaining) {
    if (finalSuggestions.length >= count) break;
    if (!finalSuggestions.includes(candidate.letter)) {
      finalSuggestions.push(candidate.letter);
    }
  }

  return finalSuggestions;
}

/**
 * Get all letters present in phrase that haven't been guessed.
 */
export function getUnrevealedLetters(
  phrase: string,
  guessedLetters: string[]
): string[] {
  const guessedSet = new Set(guessedLetters.map(l => l.toUpperCase()));
  const upperPhrase = phrase.toUpperCase();
  const unrevealed = new Set<string>();

  for (const char of upperPhrase) {
    if (/[A-Z]/.test(char) && !guessedSet.has(char)) {
      unrevealed.add(char);
    }
  }

  return Array.from(unrevealed);
}

/**
 * Get unrevealed consonants in the puzzle.
 */
export function getUnrevealedConsonants(
  phrase: string,
  guessedLetters: string[]
): string[] {
  return getUnrevealedLetters(phrase, guessedLetters)
    .filter(l => !VOWELS.has(l));
}

/**
 * Get unrevealed vowels in the puzzle.
 */
export function getUnrevealedVowels(
  phrase: string,
  guessedLetters: string[]
): string[] {
  return getUnrevealedLetters(phrase, guessedLetters)
    .filter(l => VOWELS.has(l));
}

/**
 * Get first letter positions for each word.
 */
export function getFirstLetterPositions(phrase: string): number[] {
  const positions: number[] = [];
  const words = phrase.split(' ');
  let charIndex = 0;

  for (const word of words) {
    // Find first letter in word
    for (let i = 0; i < word.length; i++) {
      if (/[A-Z]/i.test(word[i])) {
        positions.push(charIndex + i);
        break;
      }
    }
    charIndex += word.length + 1; // +1 for space
  }

  return positions;
}

/**
 * Get positions of all letters in a specific word.
 */
export function getWordPositions(
  phrase: string,
  wordIndex: number
): { start: number; end: number; positions: number[] } {
  const words = phrase.split(' ');
  if (wordIndex < 0 || wordIndex >= words.length) {
    return { start: 0, end: 0, positions: [] };
  }

  let charIndex = 0;
  for (let i = 0; i < wordIndex; i++) {
    charIndex += words[i].length + 1;
  }

  const word = words[wordIndex];
  const positions: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (/[A-Z]/i.test(word[i])) {
      positions.push(charIndex + i);
    }
  }

  return {
    start: charIndex,
    end: charIndex + word.length,
    positions
  };
}
