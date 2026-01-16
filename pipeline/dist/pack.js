import { glob } from 'glob';
import { mkdirSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import { parseFile } from './adapters/index.js';
import { normalizePhrase, extractLetters, countWords, calculateVowelRatio, countUniqueLetters, validatePhrase, } from './normalize/index.js';
import { mapCategory } from './normalize/category.js';
import { generatePuzzleId, deduplicatePuzzles } from './dedupe.js';
import { computeDifficulty } from './difficulty.js';
import { SeededRNG } from './rng.js';
import { PackSchema, ReportSchema } from './schema.js';
/**
 * Main ingestion function
 */
export async function ingestPuzzles(options) {
    const { inputs, pack: packName, seed, categoriesInclude, categoriesExclude, roundTypes = ['MAIN'], minLength = 3, maxLength = 100, difficultyMin, difficultyMax, limit, dryRun = false, strict = false, outdir, } = options;
    const rng = new SeededRNG(seed);
    const skipped = {};
    let totalRowsRead = 0;
    const resolvedInputs = [];
    // Resolve glob patterns
    for (const input of inputs) {
        const matches = await glob(input, { nodir: true });
        resolvedInputs.push(...matches);
    }
    if (resolvedInputs.length === 0) {
        throw new Error(`No files matched: ${inputs.join(', ')}`);
    }
    const allRaw = [];
    for (const filePath of resolvedInputs) {
        try {
            const puzzles = parseFile(filePath);
            totalRowsRead += puzzles.length;
            for (const p of puzzles) {
                allRaw.push({
                    ...p,
                    sourcePath: filePath,
                });
            }
        }
        catch (err) {
            if (strict)
                throw err;
            console.warn(`Warning: Failed to parse ${filePath}:`, err);
            skipped['parse_error'] = (skipped['parse_error'] || 0) + 1;
        }
    }
    const processed = [];
    for (const raw of allRaw) {
        // Normalize phrase
        const normalizedPhrase = normalizePhrase(raw.phrase);
        // Validate
        const validation = validatePhrase(normalizedPhrase, { minLength, maxLength });
        if (!validation.valid) {
            if (strict) {
                throw new Error(`Validation failed for "${raw.phrase}": ${validation.reason}`);
            }
            skipped[validation.reason] = (skipped[validation.reason] || 0) + 1;
            continue;
        }
        // Map category
        const { category, original } = mapCategory(raw.category);
        // Parse round type
        let roundType = 'MAIN';
        if (raw.round_type) {
            const upper = raw.round_type.toUpperCase();
            if (upper === 'MAIN' || upper === 'TOSSUP' || upper === 'BONUS') {
                roundType = upper;
            }
        }
        // Apply category filters
        if (categoriesInclude && categoriesInclude.length > 0) {
            if (!categoriesInclude.includes(category)) {
                skipped['category_filtered'] = (skipped['category_filtered'] || 0) + 1;
                continue;
            }
        }
        if (categoriesExclude && categoriesExclude.length > 0) {
            if (categoriesExclude.includes(category)) {
                skipped['category_excluded'] = (skipped['category_excluded'] || 0) + 1;
                continue;
            }
        }
        // Apply round type filter
        if (!roundTypes.includes(roundType)) {
            skipped['round_type_filtered'] = (skipped['round_type_filtered'] || 0) + 1;
            continue;
        }
        // Compute metadata
        const letters = extractLetters(normalizedPhrase);
        const wordCount = countWords(normalizedPhrase);
        const uniqueLetters = countUniqueLetters(letters);
        const vowelRatio = calculateVowelRatio(letters);
        const difficulty = computeDifficulty(normalizedPhrase);
        // Apply difficulty filters
        if (difficultyMin !== undefined && difficulty.score < difficultyMin) {
            skipped['difficulty_too_low'] = (skipped['difficulty_too_low'] || 0) + 1;
            continue;
        }
        if (difficultyMax !== undefined && difficulty.score > difficultyMax) {
            skipped['difficulty_too_high'] = (skipped['difficulty_too_high'] || 0) + 1;
            continue;
        }
        processed.push({
            phrase: normalizedPhrase,
            category,
            originalCategory: original,
            roundType,
            sourcePath: raw.sourcePath,
            letters,
            wordCount,
            uniqueLetters,
            vowelRatio,
            difficulty,
        });
    }
    // Deduplicate
    const { unique, duplicatesRemoved } = deduplicatePuzzles(processed);
    // Sort deterministically by ID (compute IDs first)
    const withIds = unique.map(p => ({
        ...p,
        id: generatePuzzleId(p.phrase, p.category, p.roundType),
    }));
    withIds.sort((a, b) => a.id.localeCompare(b.id));
    // Apply limit with seeded sampling if needed
    let finalPuzzles = withIds;
    if (limit && limit < withIds.length) {
        finalPuzzles = rng.sample(withIds, limit);
        // Re-sort after sampling for determinism
        finalPuzzles.sort((a, b) => a.id.localeCompare(b.id));
    }
    // Build final puzzles
    const puzzles = finalPuzzles.map(p => ({
        id: p.id,
        phrase: p.phrase,
        category: p.category,
        round_type: p.roundType,
        source: {
            type: detectSourceType(p.sourcePath),
            path: p.sourcePath,
            name: basename(p.sourcePath),
            source_category: p.originalCategory,
        },
        normalized: {
            phrase: p.phrase,
            letters: p.letters,
            word_count: p.wordCount,
            char_count: p.phrase.length,
            unique_letter_count: p.uniqueLetters,
            vowel_ratio: p.vowelRatio,
        },
        difficulty: p.difficulty,
    }));
    // Compute stats
    const categoryDist = {};
    const roundTypeDist = {};
    for (const p of puzzles) {
        categoryDist[p.category] = (categoryDist[p.category] || 0) + 1;
        roundTypeDist[p.round_type] = (roundTypeDist[p.round_type] || 0) + 1;
    }
    // Build pack
    const pack = {
        pack_id: packName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: packName,
        license_note: 'User-imported/generated pack',
        created_at: new Date().toISOString(),
        stats: {
            count: puzzles.length,
            categories: categoryDist,
            round_types: roundTypeDist,
        },
        puzzles,
    };
    // Validate pack with Zod
    PackSchema.parse(pack);
    // Build report
    const sortedByDifficulty = [...puzzles].sort((a, b) => b.difficulty.score - a.difficulty.score);
    const hardest = sortedByDifficulty.slice(0, 20).map(p => ({
        id: p.id,
        phrase: p.phrase.length > 40 ? p.phrase.slice(0, 37) + '...' : p.phrase,
        score: p.difficulty.score,
    }));
    const easiest = sortedByDifficulty.slice(-20).reverse().map(p => ({
        id: p.id,
        phrase: p.phrase.length > 40 ? p.phrase.slice(0, 37) + '...' : p.phrase,
        score: p.difficulty.score,
    }));
    const report = {
        pack_id: pack.pack_id,
        created_at: pack.created_at,
        inputs: resolvedInputs,
        total_rows_read: totalRowsRead,
        valid_puzzles_kept: puzzles.length,
        skipped,
        duplicates_removed: duplicatesRemoved,
        category_distribution: categoryDist,
        round_type_distribution: roundTypeDist,
        hardest,
        easiest,
    };
    // Validate report
    ReportSchema.parse(report);
    // Write files
    if (!dryRun) {
        const packDir = resolve(outdir, 'packs');
        const reportDir = resolve(outdir, 'reports');
        mkdirSync(packDir, { recursive: true });
        mkdirSync(reportDir, { recursive: true });
        const packPath = resolve(packDir, `${pack.pack_id}.json`);
        const reportPath = resolve(reportDir, `${pack.pack_id}-report.json`);
        writeFileSync(packPath, JSON.stringify(pack, null, 2));
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`Pack written to: ${packPath}`);
        console.log(`Report written to: ${reportPath}`);
    }
    return { pack, report };
}
function detectSourceType(filePath) {
    if (filePath.endsWith('.csv'))
        return 'csv';
    if (filePath.endsWith('.txt'))
        return 'text_file';
    if (filePath.endsWith('.json'))
        return 'json';
    if (filePath.endsWith('.jsonl'))
        return 'jsonl';
    return 'unknown';
}
