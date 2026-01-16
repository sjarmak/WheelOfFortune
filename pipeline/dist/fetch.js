#!/usr/bin/env node
/**
 * Fetch puzzle data from remote sources
 *
 * Usage:
 *   npm run pipeline:fetch -- --source wof1_20
 *   npm run pipeline:fetch -- --source kaggle_answers
 */
import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
const CACHE_DIR = 'data/cache';
const RAW_DIR = 'data/raw';
const SOURCES = [
    {
        id: 'wof1_20',
        name: 'WOF Seasons 1-20',
        type: 'http',
        url: 'https://raw.githubusercontent.com/Duthomhas/WOF1-20/main/wof.1-20.txt',
        format: 'txt',
        filename: 'wof_seasons_1_20.txt',
    },
    {
        id: 'kaggle_answers',
        name: 'Kaggle: Wheel of Fortune Answers',
        type: 'kaggle',
        url: 'darrylljk/wheel-of-fortune-answers',
        format: 'zip',
        filename: 'wheel-of-fortune-answers.zip',
    },
    {
        id: 'kaggle_bonus',
        name: 'Kaggle: Wheel of Fortune Bonus Rounds',
        type: 'kaggle',
        url: 'parrotypoisson/wheel-of-fortune-bonus-rounds',
        format: 'zip',
        filename: 'wheel-of-fortune-bonus-rounds.zip',
    },
];
async function fetchHTTP(url, destPath) {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    writeFileSync(destPath, content);
    console.log(`Saved to ${destPath}`);
}
async function fetchKaggle(dataset, destDir) {
    console.log(`Downloading Kaggle dataset: ${dataset}...`);
    // Check for Kaggle credentials
    const kaggleJson = join(process.env.HOME || '', '.kaggle', 'kaggle.json');
    const envToken = process.env.KAGGLE_API_TOKEN;
    if (!existsSync(kaggleJson) && !envToken) {
        // Check for .env.local
        const envLocal = resolve(process.cwd(), '../app/.env.local');
        if (existsSync(envLocal)) {
            const envContent = readFileSync(envLocal, 'utf-8');
            const match = envContent.match(/KAGGLE_API_TOKEN=(.+)/);
            if (match) {
                process.env.KAGGLE_API_TOKEN = match[1].trim();
            }
        }
    }
    // Use kaggle CLI
    try {
        mkdirSync(destDir, { recursive: true });
        execSync(`kaggle datasets download -d ${dataset} -p ${destDir} --unzip`, {
            stdio: 'inherit',
        });
        console.log(`Downloaded to ${destDir}`);
    }
    catch (err) {
        console.error('Kaggle CLI failed. Make sure you have:');
        console.error('1. Kaggle CLI installed: pip install kaggle');
        console.error('2. API credentials in ~/.kaggle/kaggle.json or KAGGLE_API_TOKEN env var');
        throw err;
    }
}
const program = new Command();
program
    .name('wof-fetch')
    .description('Fetch puzzle data from remote sources')
    .version('1.0.0');
program
    .command('list')
    .description('List available sources')
    .action(() => {
    console.log('Available sources:\n');
    for (const source of SOURCES) {
        console.log(`  ${source.id}`);
        console.log(`    Name: ${source.name}`);
        console.log(`    Type: ${source.type}`);
        console.log(`    URL: ${source.url}`);
        console.log('');
    }
});
program
    .command('get')
    .description('Fetch a source')
    .argument('<source>', 'Source ID')
    .option('-o, --outdir <path>', 'Output directory', RAW_DIR)
    .action(async (sourceId, opts) => {
    const source = SOURCES.find(s => s.id === sourceId);
    if (!source) {
        console.error(`Unknown source: ${sourceId}`);
        console.error(`Available: ${SOURCES.map(s => s.id).join(', ')}`);
        process.exit(1);
    }
    mkdirSync(opts.outdir, { recursive: true });
    const destPath = join(opts.outdir, source.filename);
    try {
        if (source.type === 'http') {
            await fetchHTTP(source.url, destPath);
        }
        else if (source.type === 'kaggle') {
            await fetchKaggle(source.url, opts.outdir);
        }
        console.log('\nDone! Run ingest to process:');
        console.log(`  npm run pipeline:ingest -- -i "${opts.outdir}/*.csv" -p my_pack`);
    }
    catch (err) {
        console.error('Fetch failed:', err);
        process.exit(1);
    }
});
program
    .command('all')
    .description('Fetch all HTTP sources (Kaggle requires manual auth)')
    .option('-o, --outdir <path>', 'Output directory', RAW_DIR)
    .action(async (opts) => {
    mkdirSync(opts.outdir, { recursive: true });
    for (const source of SOURCES) {
        if (source.type === 'http') {
            const destPath = join(opts.outdir, source.filename);
            try {
                await fetchHTTP(source.url, destPath);
            }
            catch (err) {
                console.error(`Failed to fetch ${source.id}:`, err);
            }
        }
        else {
            console.log(`Skipping ${source.id} (requires Kaggle auth)`);
        }
    }
});
program.parse();
