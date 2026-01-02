import { readFileSync } from 'fs';
import type { RawPuzzle } from '../schema.js';

/**
 * Parse a JSONL file (one JSON object per line)
 */
export function parseJSONL(filePath: string): RawPuzzle[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const puzzles: RawPuzzle[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const item = JSON.parse(trimmed);
      
      if (typeof item !== 'object' || item === null) continue;

      const phrase = item.phrase || item.answer || item.puzzle || item.word;
      if (!phrase || typeof phrase !== 'string') continue;

      puzzles.push({
        phrase: phrase.trim(),
        category: item.category?.toString().trim(),
        round_type: item.round_type?.toString().trim() || item.roundType?.toString().trim(),
      });
    } catch {
      // Skip invalid JSON lines
      continue;
    }
  }

  return puzzles;
}
