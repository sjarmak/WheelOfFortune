#!/usr/bin/env node
/**
 * Scrape puzzle data from Buy a Vowel Boards Compendium
 *
 * Usage:
 *   npm run pipeline:scrape -- --seasons 41-43 --outdir data/scraped
 */
import { Command } from 'commander';
import { scrapeAllSeasons, SEASONS } from './scrapers/buyavowel.js';
import { resolve } from 'path';
const program = new Command();
program
    .name('wof-scrape')
    .description('Scrape puzzle data from Buy a Vowel Boards')
    .version('1.0.0');
program
    .command('buyavowel')
    .description('Scrape Buy a Vowel Boards Compendium')
    .option('-s, --seasons <range>', 'Season range (e.g., 41-43 or 41)', 'all')
    .option('-o, --outdir <path>', 'Output directory', 'data/scraped/buyavowel')
    .option('-d, --delay <ms>', 'Delay between requests in ms', '1000')
    .action(async (opts) => {
    let seasonRange;
    if (opts.seasons !== 'all') {
        const parts = opts.seasons.split('-').map((s) => parseInt(s.trim()));
        if (parts.length === 1) {
            seasonRange = { start: parts[0], end: parts[0] };
        }
        else {
            seasonRange = { start: parts[0], end: parts[1] };
        }
        console.log(`Scraping seasons ${seasonRange.start} to ${seasonRange.end}...`);
    }
    else {
        console.log(`Scraping all ${SEASONS.length} seasons...`);
    }
    const outDir = resolve(process.cwd(), opts.outdir);
    await scrapeAllSeasons(outDir, seasonRange, parseInt(opts.delay));
    console.log('\nDone! Run ingest to process:');
    console.log(`  npm run pipeline:ingest -- ingest -i "${opts.outdir}/*.json" -p buyavowel`);
});
program
    .command('list')
    .description('List available seasons')
    .action(() => {
    console.log('Available seasons:\n');
    for (const s of SEASONS) {
        console.log(`  Season ${s.season.toString().padStart(2, ' ')} (${s.years})`);
    }
    console.log(`\nTotal: ${SEASONS.length} seasons`);
});
program.parse();
