import type { RawPuzzle } from '../schema.js';
export type AdapterType = 'csv' | 'txt' | 'json' | 'jsonl';
/**
 * Detect file type from extension
 */
export declare function detectFileType(filePath: string): AdapterType;
/**
 * Parse a file using the appropriate adapter
 */
export declare function parseFile(filePath: string, type?: AdapterType): RawPuzzle[];
export { parseCSV } from './csv.js';
export { parseTXT } from './txt.js';
export { parseJSON } from './json.js';
export { parseJSONL } from './jsonl.js';
