#!/usr/bin/env node
import { Command } from 'commander';
import { ingestPuzzles } from './pack.js';
const program = new Command();
program
    .name('wof-pipeline')
    .description('Wheel of Fortune puzzle ingestion pipeline')
    .version('1.0.0');
program
    .command('ingest')
    .description('Ingest puzzle data and generate a pack')
    .requiredOption('-i, --input <paths...>', 'Input file(s) or glob patterns')
    .requiredOption('-p, --pack <name>', 'Pack name')
    .option('-s, --seed <string>', 'RNG seed for deterministic output', 'default')
    .option('--categories-include <list>', 'Comma-separated categories to include')
    .option('--categories-exclude <list>', 'Comma-separated categories to exclude')
    .option('--round-types <list>', 'Comma-separated round types (MAIN,TOSSUP,BONUS)', 'MAIN')
    .option('--min-length <int>', 'Minimum letter count', parseInt)
    .option('--max-length <int>', 'Maximum letter count', parseInt)
    .option('--difficulty-min <float>', 'Minimum difficulty score', parseFloat)
    .option('--difficulty-max <float>', 'Maximum difficulty score', parseFloat)
    .option('-l, --limit <int>', 'Limit number of puzzles', parseInt)
    .option('-n, --dry-run', 'Print summary without writing files')
    .option('--strict', 'Fail on validation errors instead of skipping')
    .option('-o, --outdir <path>', 'Output directory', 'data')
    .action(async (opts) => {
    try {
        const categoriesInclude = opts.categoriesInclude?.split(',').map((s) => s.trim().toUpperCase());
        const categoriesExclude = opts.categoriesExclude?.split(',').map((s) => s.trim().toUpperCase());
        const roundTypes = opts.roundTypes.split(',').map((s) => s.trim().toUpperCase());
        const result = await ingestPuzzles({
            inputs: opts.input,
            pack: opts.pack,
            seed: opts.seed,
            categoriesInclude,
            categoriesExclude,
            roundTypes,
            minLength: opts.minLength,
            maxLength: opts.maxLength,
            difficultyMin: opts.difficultyMin,
            difficultyMax: opts.difficultyMax,
            limit: opts.limit,
            dryRun: opts.dryRun,
            strict: opts.strict,
            outdir: opts.outdir,
        });
        console.log('\n--- Summary ---');
        console.log(`Pack: ${result.pack.name} (${result.pack.pack_id})`);
        console.log(`Total puzzles: ${result.pack.stats.count}`);
        console.log(`Rows read: ${result.report.total_rows_read}`);
        console.log(`Duplicates removed: ${result.report.duplicates_removed}`);
        if (Object.keys(result.report.skipped).length > 0) {
            console.log('\nSkipped:');
            for (const [reason, count] of Object.entries(result.report.skipped)) {
                console.log(`  ${reason}: ${count}`);
            }
        }
        console.log('\nCategories:');
        for (const [cat, count] of Object.entries(result.report.category_distribution)) {
            console.log(`  ${cat}: ${count}`);
        }
        if (opts.dryRun) {
            console.log('\n(Dry run - no files written)');
        }
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
});
program.parse();
