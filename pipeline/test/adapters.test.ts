import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { parseCSV } from '../src/adapters/csv.js';
import { parseTXT } from '../src/adapters/txt.js';
import { parseJSONL } from '../src/adapters/jsonl.js';
import { parseFile, detectFileType } from '../src/adapters/index.js';

const FIXTURES = resolve(import.meta.dirname, 'fixtures');

describe('detectFileType', () => {
  it('detects CSV', () => {
    expect(detectFileType('file.csv')).toBe('csv');
    expect(detectFileType('path/to/file.CSV')).toBe('csv');
  });

  it('detects TXT', () => {
    expect(detectFileType('file.txt')).toBe('txt');
  });

  it('detects JSON', () => {
    expect(detectFileType('file.json')).toBe('json');
  });

  it('detects JSONL', () => {
    expect(detectFileType('file.jsonl')).toBe('jsonl');
    expect(detectFileType('file.ndjson')).toBe('jsonl');
  });

  it('defaults to txt for unknown', () => {
    expect(detectFileType('file.xyz')).toBe('txt');
  });
});

describe('parseCSV', () => {
  it('parses sample CSV', () => {
    const puzzles = parseCSV(resolve(FIXTURES, 'sample.csv'));
    expect(puzzles.length).toBe(5);
    expect(puzzles[0].phrase).toBe('PRACTICE MAKES PERFECT');
    expect(puzzles[0].category).toBe('PHRASE');
  });

  it('handles different column names', () => {
    const puzzles = parseCSV(resolve(FIXTURES, 'sample.csv'));
    expect(puzzles.every(p => p.phrase)).toBe(true);
  });
});

describe('parseTXT', () => {
  it('parses sample TXT', () => {
    const puzzles = parseTXT(resolve(FIXTURES, 'sample.txt'));
    expect(puzzles.length).toBe(4);
  });

  it('handles tab-separated format', () => {
    const puzzles = parseTXT(resolve(FIXTURES, 'sample.txt'));
    const withCategory = puzzles.find(p => p.category === 'PHRASE');
    expect(withCategory).toBeDefined();
    expect(withCategory?.phrase).toBe('A PENNY FOR YOUR THOUGHTS');
  });

  it('skips comments', () => {
    const puzzles = parseTXT(resolve(FIXTURES, 'sample.txt'));
    const hasComment = puzzles.some(p => p.phrase.startsWith('#'));
    expect(hasComment).toBe(false);
  });
});

describe('parseJSONL', () => {
  it('parses sample JSONL', () => {
    const puzzles = parseJSONL(resolve(FIXTURES, 'sample.jsonl'));
    expect(puzzles.length).toBe(3);
    expect(puzzles[0].phrase).toBe('WHEEL OF FORTUNE');
    expect(puzzles[0].category).toBe('TITLE');
  });
});

describe('parseFile', () => {
  it('auto-detects file type', () => {
    const csv = parseFile(resolve(FIXTURES, 'sample.csv'));
    const txt = parseFile(resolve(FIXTURES, 'sample.txt'));
    const jsonl = parseFile(resolve(FIXTURES, 'sample.jsonl'));
    
    expect(csv.length).toBe(5);
    expect(txt.length).toBe(4);
    expect(jsonl.length).toBe(3);
  });
});
