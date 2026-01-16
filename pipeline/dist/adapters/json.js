import { readFileSync } from 'fs';
/**
 * Parse a JSON file containing an array of puzzle objects
 *
 * Expected formats:
 * 1. Array: [ { "phrase": "...", "category": "...", "round_type": "..." }, ... ]
 * 2. Pack wrapper: { "puzzles": [ ... ] }
 * 3. Scraped season: { "season": 41, "puzzles": [ ... ] }
 */
export function parseJSON(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    // Handle wrapped format
    const items = Array.isArray(data) ? data : (data.puzzles || []);
    if (!Array.isArray(items)) {
        throw new Error('JSON must contain an array of puzzles');
    }
    // Extract season number if present (for scraped data)
    const season = data.season;
    const puzzles = [];
    for (const item of items) {
        if (typeof item !== 'object' || item === null)
            continue;
        // Try various field names
        const phrase = item.phrase || item.answer || item.puzzle || item.word;
        if (!phrase || typeof phrase !== 'string')
            continue;
        // Skip phrases that look like header artifacts
        const cleanPhrase = phrase.trim();
        if (cleanPhrase.startsWith('ROUND ') || cleanPhrase.startsWith('PUZZLE '))
            continue;
        puzzles.push({
            phrase: cleanPhrase,
            category: item.category?.toString().trim(),
            round_type: item.round_type?.toString().trim() || item.roundType?.toString().trim(),
        });
    }
    return puzzles;
}
