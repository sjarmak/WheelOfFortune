import { createHash } from 'crypto';
import { generateDedupeKey } from './normalize/index.js';
/**
 * Generate a deterministic ID for a puzzle
 * ID = sha1(normalizedDedupKey + "|" + canonicalCategory + "|" + round_type)
 */
export function generatePuzzleId(phrase, category, roundType) {
    const dedupeKey = generateDedupeKey(phrase);
    const input = `${dedupeKey}|${category}|${roundType}`;
    return createHash('sha1').update(input).digest('hex');
}
/**
 * Deduplicate puzzles based on their dedupe key
 * Returns array of unique puzzles and count of duplicates removed
 */
export function deduplicatePuzzles(puzzles) {
    const seen = new Map();
    let duplicatesRemoved = 0;
    for (const puzzle of puzzles) {
        const key = generateDedupeKey(puzzle.phrase);
        if (!seen.has(key)) {
            seen.set(key, puzzle);
        }
        else {
            duplicatesRemoved++;
        }
    }
    return {
        unique: Array.from(seen.values()),
        duplicatesRemoved,
    };
}
