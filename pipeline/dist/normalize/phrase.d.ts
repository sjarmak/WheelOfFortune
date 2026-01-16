/**
 * Phrase normalization utilities
 */
/**
 * Normalize a phrase for display
 * - Uppercase A-Z
 * - Preserve spaces and allowed punctuation
 * - Convert fancy quotes/dashes to ASCII
 * - Collapse multiple whitespace
 */
export declare function normalizePhrase(input: string): string;
/**
 * Generate dedupe key from phrase
 * - Uppercase
 * - Remove all non A-Z
 * - Collapse whitespace
 * - Trim
 */
export declare function generateDedupeKey(input: string): string;
/**
 * Extract letters from phrase (A-Z only)
 */
export declare function extractLetters(phrase: string): string[];
/**
 * Count words in phrase
 */
export declare function countWords(phrase: string): number;
/**
 * Calculate vowel ratio
 */
export declare function calculateVowelRatio(letters: string[]): number;
/**
 * Count unique letters
 */
export declare function countUniqueLetters(letters: string[]): number;
/**
 * Count rare letters (J, Q, X, Z)
 */
export declare function countRareLetters(letters: string[]): number;
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
export declare function validatePhrase(phrase: string, options?: {
    minLength?: number;
    maxLength?: number;
    maxNonLetterRatio?: number;
}): ValidationResult;
