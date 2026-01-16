export interface DifficultyResult {
    score: number;
    reasons: string[];
}
/**
 * Compute difficulty score for a phrase
 *
 * Factors:
 * - Letter count (more = harder)
 * - Vowel ratio (very low or very high = harder, low is worse)
 * - Rare letters (J, Q, X, Z = harder)
 * - Unique letter count (more unique = harder)
 * - Word count (more words = slightly harder)
 *
 * Returns score 0-1 where 1 is hardest
 */
export declare function computeDifficulty(phrase: string): DifficultyResult;
