import type { RawPuzzle } from '../schema.js';
/**
 * Parse a plain text file with one puzzle per line
 *
 * Supported formats:
 * - CATEGORY<TAB>PHRASE
 * - PHRASE (category defaults to OTHER)
 */
export declare function parseTXT(filePath: string): RawPuzzle[];
