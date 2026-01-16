import type { RawPuzzle } from '../schema.js';
/**
 * Parse a JSON file containing an array of puzzle objects
 *
 * Expected formats:
 * 1. Array: [ { "phrase": "...", "category": "...", "round_type": "..." }, ... ]
 * 2. Pack wrapper: { "puzzles": [ ... ] }
 * 3. Scraped season: { "season": 41, "puzzles": [ ... ] }
 */
export declare function parseJSON(filePath: string): RawPuzzle[];
