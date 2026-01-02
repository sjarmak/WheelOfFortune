import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import type { RawPuzzle } from '../schema.js';

// Common column name variants
const PHRASE_COLUMNS = ['phrase', 'answer', 'puzzle', 'word', 'solution'];
const CATEGORY_COLUMNS = ['category', 'cat', 'type'];
const ROUND_TYPE_COLUMNS = ['round_type', 'roundtype', 'round', 'type'];

/**
 * Find a matching column name (case-insensitive)
 */
function findColumn(headers: string[], variants: string[]): string | undefined {
  const lowerVariants = variants.map(v => v.toLowerCase());
  return headers.find(h => lowerVariants.includes(h.toLowerCase()));
}

/**
 * Parse a CSV file and extract puzzles
 */
export function parseCSV(filePath: string): RawPuzzle[] {
  const content = readFileSync(filePath, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    return [];
  }

  // Get headers from first record
  const headers = Object.keys(records[0]);

  // Find matching columns
  const phraseCol = findColumn(headers, PHRASE_COLUMNS);
  const categoryCol = findColumn(headers, CATEGORY_COLUMNS);
  const roundTypeCol = findColumn(headers, ROUND_TYPE_COLUMNS);

  if (!phraseCol) {
    throw new Error(`No phrase column found. Headers: ${headers.join(', ')}`);
  }

  const puzzles: RawPuzzle[] = [];

  for (const record of records) {
    const phrase = record[phraseCol];
    if (!phrase || phrase.trim() === '') continue;

    puzzles.push({
      phrase: phrase.trim(),
      category: categoryCol ? record[categoryCol]?.trim() : undefined,
      round_type: roundTypeCol ? record[roundTypeCol]?.trim() : undefined,
    });
  }

  return puzzles;
}
