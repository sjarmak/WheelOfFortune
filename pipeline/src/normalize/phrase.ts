/**
 * Phrase normalization utilities
 */

// Fancy quote/dash replacements
const REPLACEMENTS: [RegExp, string][] = [
  [/[\u2018\u2019\u201A\u201B]/g, "'"],  // Fancy single quotes -> apostrophe
  [/[\u201C\u201D\u201E\u201F]/g, '"'],  // Fancy double quotes -> quote
  [/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-'],  // Various dashes -> hyphen
  [/[\u2026]/g, '...'],  // Ellipsis
  [/[\u00A0]/g, ' '],    // Non-breaking space
];

// Allowed punctuation in display phrase
const ALLOWED_PUNCTUATION = /['\-&,\.\!\?:;]/;

// Control characters and emoji detection
const CONTROL_CHARS = /[\x00-\x1F\x7F]/;
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

/**
 * Normalize a phrase for display
 * - Uppercase A-Z
 * - Preserve spaces and allowed punctuation
 * - Convert fancy quotes/dashes to ASCII
 * - Collapse multiple whitespace
 */
export function normalizePhrase(input: string): string {
  let result = input;

  // Apply replacements
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Uppercase
  result = result.toUpperCase();

  // Keep only letters, spaces, and allowed punctuation
  result = result
    .split('')
    .filter(char => /[A-Z ]/.test(char) || ALLOWED_PUNCTUATION.test(char))
    .join('');

  // Collapse whitespace and trim
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Generate dedupe key from phrase
 * - Uppercase
 * - Remove all non A-Z
 * - Collapse whitespace
 * - Trim
 */
export function generateDedupeKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .trim();
}

/**
 * Extract letters from phrase (A-Z only)
 */
export function extractLetters(phrase: string): string[] {
  return phrase.match(/[A-Z]/g) || [];
}

/**
 * Count words in phrase
 */
export function countWords(phrase: string): number {
  const words = phrase.trim().split(/\s+/);
  return words.filter(w => w.length > 0).length;
}

/**
 * Calculate vowel ratio
 */
export function calculateVowelRatio(letters: string[]): number {
  if (letters.length === 0) return 0;
  const vowels = letters.filter(l => 'AEIOU'.includes(l));
  return vowels.length / letters.length;
}

/**
 * Count unique letters
 */
export function countUniqueLetters(letters: string[]): number {
  return new Set(letters).size;
}

/**
 * Count rare letters (J, Q, X, Z)
 */
export function countRareLetters(letters: string[]): number {
  return letters.filter(l => 'JQXZ'.includes(l)).length;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a phrase
 */
export function validatePhrase(
  phrase: string,
  options: {
    minLength?: number;
    maxLength?: number;
    maxNonLetterRatio?: number;
  } = {}
): ValidationResult {
  const {
    minLength = 3,
    maxLength = 100,
    maxNonLetterRatio = 0.3,
  } = options;

  // Check for control characters
  if (CONTROL_CHARS.test(phrase)) {
    return { valid: false, reason: 'contains_control_chars' };
  }

  // Check for emojis
  if (EMOJI_REGEX.test(phrase)) {
    return { valid: false, reason: 'contains_emoji' };
  }

  // Extract letters
  const letters = extractLetters(phrase);

  // Check minimum letters
  if (letters.length < minLength) {
    return { valid: false, reason: 'too_few_letters' };
  }

  // Check maximum length
  if (phrase.length > maxLength) {
    return { valid: false, reason: 'too_long' };
  }

  // Check non-letter ratio (excluding spaces)
  const nonSpaceChars = phrase.replace(/\s/g, '');
  const nonLetterCount = nonSpaceChars.length - letters.length;
  if (nonSpaceChars.length > 0 && nonLetterCount / nonSpaceChars.length > maxNonLetterRatio) {
    return { valid: false, reason: 'too_many_symbols' };
  }

  // Check for header-like content
  const lowerPhrase = phrase.toLowerCase();
  if (
    lowerPhrase.includes('category') ||
    lowerPhrase.includes('puzzle') ||
    lowerPhrase.includes('answer') ||
    lowerPhrase === 'null' ||
    lowerPhrase === 'undefined' ||
    lowerPhrase === 'n/a' ||
    lowerPhrase === 'na'
  ) {
    return { valid: false, reason: 'looks_like_header_or_null' };
  }

  return { valid: true };
}
