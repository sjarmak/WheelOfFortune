import { readFileSync } from 'fs';
import type { RawPuzzle } from '../schema.js';

/**
 * Parse a plain text file with one puzzle per line
 * 
 * Supported formats:
 * - CATEGORY<TAB>PHRASE
 * - PHRASE (category defaults to OTHER)
 */
export function parseTXT(filePath: string): RawPuzzle[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const puzzles: RawPuzzle[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for tab-separated format
    if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t');
      if (parts.length >= 2) {
        puzzles.push({
          category: parts[0].trim(),
          phrase: parts[1].trim(),
          round_type: parts[2]?.trim(),
        });
        continue;
      }
    }

    // Plain phrase format
    puzzles.push({
      phrase: trimmed,
    });
  }

  return puzzles;
}
