import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { KaggleAdapter } from './adapters/kaggle.js';
import { TextAdapter } from './adapters/text.js';
import { normalizeCategory, generatePuzzleId, validatePhrase, getCleanLetters } from './utils/normalize.js';
import { calculateDifficulty } from './utils/difficulty.js';
import { NormalizedPuzzle, PuzzlePack } from './types.js';

const program = new Command();

program
  .name('wof-pipeline')
  .description('Ingest WOF datasets and generate puzzle packs')
  .option('-i, --input <files...>', 'Input files (CSV or TXT)')
  .option('-n, --name <name>', 'Pack Name', 'Custom Pack')
  .option('-o, --output <path>', 'Output path (default: data/packs/custom.json)', 'data/packs/custom.json')
  .action(async (options) => {
    console.log(`Starting ingestion for pack: ${options.name}`);
    const inputs: string[] = options.input || [];
    
    if (inputs.length === 0) {
      console.error('No input files specified. Use -i <file>');
      process.exit(1);
    }

    let allRawPuzzles: any[] = [];

    for (const file of inputs) {
      console.log(`Reading ${file}...`);
      const ext = path.extname(file).toLowerCase();
      let adapter;
      
      if (ext === '.csv') adapter = new KaggleAdapter();
      else adapter = new TextAdapter(); // Default to text

      try {
        const raw = await adapter.parse(file);
        allRawPuzzles = allRawPuzzles.concat(raw);
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }

    console.log(`Total raw items: ${allRawPuzzles.length}`);

    // Processing
    const deduped = new Map<string, NormalizedPuzzle>();
    const stats = {
      count: 0,
      categories: {} as Record<string, number>,
      round_types: {} as Record<string, number>
    };

    for (const p of allRawPuzzles) {
      const validation = validatePhrase(p.phrase);
      if (!validation.valid) continue;

      const normCat = normalizeCategory(p.category);
      const id = generatePuzzleId(p.phrase, normCat, p.round_type);

      if (deduped.has(id)) continue;

      const difficulty = calculateDifficulty(p.phrase);
      const cleanLetters = getCleanLetters(p.phrase);

      const puzzle: NormalizedPuzzle = {
        id,
        phrase: p.phrase.trim().toUpperCase(),
        category: normCat,
        round_type: p.round_type,
        source: p.source,
        normalized: {
          phrase: p.phrase.trim().toUpperCase(),
          letters: cleanLetters,
          word_count: p.phrase.split(/\s+/).length,
          char_count: p.phrase.length,
          unique_letter_count: new Set(cleanLetters).size,
          vowel_ratio: (cleanLetters.join('').match(/[AEIOU]/g)?.length || 0) / (cleanLetters.length || 1)
        },
        difficulty
      };

      deduped.set(id, puzzle);

      // Stats
      stats.categories[normCat] = (stats.categories[normCat] || 0) + 1;
      stats.round_types[p.round_type] = (stats.round_types[p.round_type] || 0) + 1;
    }

    const finalPuzzles = Array.from(deduped.values());
    stats.count = finalPuzzles.length;

    const pack: PuzzlePack = {
      pack_id: path.basename(options.output, '.json'),
      name: options.name,
      license_note: "User-imported/generated pack",
      created_at: new Date().toISOString(),
      stats,
      puzzles: finalPuzzles
    };

    await fs.ensureDir(path.dirname(options.output));
    await fs.writeFile(options.output, JSON.stringify(pack, null, 2));
    
    // Write report
    const reportPath = path.join('data/reports', `${pack.pack_id}-report.json`);
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, JSON.stringify(stats, null, 2));

    console.log(`Pack generated: ${options.output} (${stats.count} puzzles)`);
  });

program.parse();
