import type { RawPuzzle } from '../schema.js';
/**
 * Parse a JSONL file (one JSON object per line)
 */
export declare function parseJSONL(filePath: string): RawPuzzle[];
