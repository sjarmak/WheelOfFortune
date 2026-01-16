import { z } from 'zod';
// Round types
export const RoundTypeSchema = z.enum(['MAIN', 'TOSSUP', 'BONUS']);
// Canonical categories
export const CANONICAL_CATEGORIES = [
    'PHRASE',
    'FOOD_AND_DRINK',
    'PLACE',
    'WHAT_ARE_YOU_DOING',
    'BEFORE_AND_AFTER',
    'SAME_NAME',
    'TITLE',
    'PERSON',
    'EVENT',
    'AROUND_THE_HOUSE',
    'THING',
    'OCCUPATION',
    'LIVING_THING',
    'ON_THE_MAP',
    'FICTIONAL_CHARACTER',
    'OTHER',
];
export const CategorySchema = z.enum(CANONICAL_CATEGORIES);
// Source information
export const SourceSchema = z.object({
    type: z.string(),
    path: z.string().optional(),
    name: z.string().optional(),
    source_category: z.string().optional(),
});
// Normalized puzzle data
export const NormalizedDataSchema = z.object({
    phrase: z.string(),
    letters: z.array(z.string()),
    word_count: z.number(),
    char_count: z.number(),
    unique_letter_count: z.number(),
    vowel_ratio: z.number(),
});
// Difficulty data
export const DifficultySchema = z.object({
    score: z.number().min(0).max(1),
    reasons: z.array(z.string()),
});
// Full puzzle schema
export const PuzzleSchema = z.object({
    id: z.string(),
    phrase: z.string(),
    category: CategorySchema,
    round_type: RoundTypeSchema,
    source: SourceSchema,
    normalized: NormalizedDataSchema,
    difficulty: DifficultySchema,
});
// Pack stats
export const PackStatsSchema = z.object({
    count: z.number(),
    categories: z.record(z.string(), z.number()),
    round_types: z.record(z.string(), z.number()),
});
// Full pack schema
export const PackSchema = z.object({
    pack_id: z.string(),
    name: z.string(),
    license_note: z.string(),
    created_at: z.string(),
    stats: PackStatsSchema,
    puzzles: z.array(PuzzleSchema),
});
// Raw input puzzle (before processing)
export const RawPuzzleSchema = z.object({
    phrase: z.string(),
    category: z.string().optional(),
    round_type: z.string().optional(),
});
// Report schema
export const ReportSchema = z.object({
    pack_id: z.string(),
    created_at: z.string(),
    inputs: z.array(z.string()),
    total_rows_read: z.number(),
    valid_puzzles_kept: z.number(),
    skipped: z.record(z.string(), z.number()),
    duplicates_removed: z.number(),
    category_distribution: z.record(z.string(), z.number()),
    round_type_distribution: z.record(z.string(), z.number()),
    hardest: z.array(z.object({ id: z.string(), phrase: z.string(), score: z.number() })),
    easiest: z.array(z.object({ id: z.string(), phrase: z.string(), score: z.number() })),
});
