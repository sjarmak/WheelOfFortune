import fs from 'fs';
import { parse } from 'csv-parse';
import { Adapter } from './index.js';

export class KaggleAdapter implements Adapter {
  async parse(filePath: string) {
    const parser = fs.createReadStream(filePath).pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    }));

    const puzzles = [];
    for await (const record of parser) {
      // Logic for generic Kaggle structure or specific ones. 
      // Common Kaggle sets have "category", "phrase" or similar columns.
      // We will look for common keys.
      
      const category = record.category || record.Category || 'OTHER';
      const phrase = record.phrase || record.answser || record.Answer || record.Puzzle || ''; // 'answser' is a common typo in some datasets
      const round = record.round || record.Round || 'MAIN';
      
      if (!phrase) continue;

      let roundType: 'MAIN' | 'TOSSUP' | 'BONUS' = 'MAIN';
      const roundUpper = round.toString().toUpperCase();
      if (roundUpper.includes('TOSS') || roundUpper.includes('TOSS UP')) roundType = 'TOSSUP';
      if (roundUpper.includes('BONUS')) roundType = 'BONUS';

      puzzles.push({
        phrase: phrase.toString(),
        category: category.toString(),
        round_type: roundType,
        source: {
          type: 'kaggle_csv',
          name: 'kaggle_import',
          path: filePath
        }
      });
    }
    return puzzles;
  }
}
