import { extname } from 'path';
import { parseCSV } from './csv.js';
import { parseTXT } from './txt.js';
import { parseJSON } from './json.js';
import { parseJSONL } from './jsonl.js';
/**
 * Detect file type from extension
 */
export function detectFileType(filePath) {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case '.csv':
            return 'csv';
        case '.txt':
            return 'txt';
        case '.json':
            return 'json';
        case '.jsonl':
        case '.ndjson':
            return 'jsonl';
        default:
            // Default to txt for unknown extensions
            return 'txt';
    }
}
/**
 * Parse a file using the appropriate adapter
 */
export function parseFile(filePath, type) {
    const fileType = type || detectFileType(filePath);
    switch (fileType) {
        case 'csv':
            return parseCSV(filePath);
        case 'txt':
            return parseTXT(filePath);
        case 'json':
            return parseJSON(filePath);
        case 'jsonl':
            return parseJSONL(filePath);
        default:
            throw new Error(`Unknown file type: ${fileType}`);
    }
}
export { parseCSV } from './csv.js';
export { parseTXT } from './txt.js';
export { parseJSON } from './json.js';
export { parseJSONL } from './jsonl.js';
