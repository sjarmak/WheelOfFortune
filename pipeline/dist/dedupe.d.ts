import type { Category, RoundType } from './schema.js';
/**
 * Generate a deterministic ID for a puzzle
 * ID = sha1(normalizedDedupKey + "|" + canonicalCategory + "|" + round_type)
 */
export declare function generatePuzzleId(phrase: string, category: Category, roundType: RoundType): string;
/**
 * Deduplicate puzzles based on their dedupe key
 * Returns array of unique puzzles and count of duplicates removed
 */
export declare function deduplicatePuzzles<T extends {
    phrase: string;
}>(puzzles: T[]): {
    unique: T[];
    duplicatesRemoved: number;
};
