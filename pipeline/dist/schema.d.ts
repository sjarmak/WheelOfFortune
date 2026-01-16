import { z } from 'zod';
export declare const RoundTypeSchema: z.ZodEnum<["MAIN", "TOSSUP", "BONUS"]>;
export type RoundType = z.infer<typeof RoundTypeSchema>;
export declare const CANONICAL_CATEGORIES: readonly ["PHRASE", "FOOD_AND_DRINK", "PLACE", "WHAT_ARE_YOU_DOING", "BEFORE_AND_AFTER", "SAME_NAME", "TITLE", "PERSON", "EVENT", "AROUND_THE_HOUSE", "THING", "OCCUPATION", "LIVING_THING", "ON_THE_MAP", "FICTIONAL_CHARACTER", "OTHER"];
export declare const CategorySchema: z.ZodEnum<["PHRASE", "FOOD_AND_DRINK", "PLACE", "WHAT_ARE_YOU_DOING", "BEFORE_AND_AFTER", "SAME_NAME", "TITLE", "PERSON", "EVENT", "AROUND_THE_HOUSE", "THING", "OCCUPATION", "LIVING_THING", "ON_THE_MAP", "FICTIONAL_CHARACTER", "OTHER"]>;
export type Category = z.infer<typeof CategorySchema>;
export declare const SourceSchema: z.ZodObject<{
    type: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    source_category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    path?: string | undefined;
    name?: string | undefined;
    source_category?: string | undefined;
}, {
    type: string;
    path?: string | undefined;
    name?: string | undefined;
    source_category?: string | undefined;
}>;
export declare const NormalizedDataSchema: z.ZodObject<{
    phrase: z.ZodString;
    letters: z.ZodArray<z.ZodString, "many">;
    word_count: z.ZodNumber;
    char_count: z.ZodNumber;
    unique_letter_count: z.ZodNumber;
    vowel_ratio: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    phrase: string;
    letters: string[];
    word_count: number;
    char_count: number;
    unique_letter_count: number;
    vowel_ratio: number;
}, {
    phrase: string;
    letters: string[];
    word_count: number;
    char_count: number;
    unique_letter_count: number;
    vowel_ratio: number;
}>;
export declare const DifficultySchema: z.ZodObject<{
    score: z.ZodNumber;
    reasons: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    score: number;
    reasons: string[];
}, {
    score: number;
    reasons: string[];
}>;
export declare const PuzzleSchema: z.ZodObject<{
    id: z.ZodString;
    phrase: z.ZodString;
    category: z.ZodEnum<["PHRASE", "FOOD_AND_DRINK", "PLACE", "WHAT_ARE_YOU_DOING", "BEFORE_AND_AFTER", "SAME_NAME", "TITLE", "PERSON", "EVENT", "AROUND_THE_HOUSE", "THING", "OCCUPATION", "LIVING_THING", "ON_THE_MAP", "FICTIONAL_CHARACTER", "OTHER"]>;
    round_type: z.ZodEnum<["MAIN", "TOSSUP", "BONUS"]>;
    source: z.ZodObject<{
        type: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        source_category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        path?: string | undefined;
        name?: string | undefined;
        source_category?: string | undefined;
    }, {
        type: string;
        path?: string | undefined;
        name?: string | undefined;
        source_category?: string | undefined;
    }>;
    normalized: z.ZodObject<{
        phrase: z.ZodString;
        letters: z.ZodArray<z.ZodString, "many">;
        word_count: z.ZodNumber;
        char_count: z.ZodNumber;
        unique_letter_count: z.ZodNumber;
        vowel_ratio: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        phrase: string;
        letters: string[];
        word_count: number;
        char_count: number;
        unique_letter_count: number;
        vowel_ratio: number;
    }, {
        phrase: string;
        letters: string[];
        word_count: number;
        char_count: number;
        unique_letter_count: number;
        vowel_ratio: number;
    }>;
    difficulty: z.ZodObject<{
        score: z.ZodNumber;
        reasons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reasons: string[];
    }, {
        score: number;
        reasons: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    phrase: string;
    id: string;
    category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
    round_type: "MAIN" | "TOSSUP" | "BONUS";
    source: {
        type: string;
        path?: string | undefined;
        name?: string | undefined;
        source_category?: string | undefined;
    };
    normalized: {
        phrase: string;
        letters: string[];
        word_count: number;
        char_count: number;
        unique_letter_count: number;
        vowel_ratio: number;
    };
    difficulty: {
        score: number;
        reasons: string[];
    };
}, {
    phrase: string;
    id: string;
    category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
    round_type: "MAIN" | "TOSSUP" | "BONUS";
    source: {
        type: string;
        path?: string | undefined;
        name?: string | undefined;
        source_category?: string | undefined;
    };
    normalized: {
        phrase: string;
        letters: string[];
        word_count: number;
        char_count: number;
        unique_letter_count: number;
        vowel_ratio: number;
    };
    difficulty: {
        score: number;
        reasons: string[];
    };
}>;
export type Puzzle = z.infer<typeof PuzzleSchema>;
export declare const PackStatsSchema: z.ZodObject<{
    count: z.ZodNumber;
    categories: z.ZodRecord<z.ZodString, z.ZodNumber>;
    round_types: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    count: number;
    categories: Record<string, number>;
    round_types: Record<string, number>;
}, {
    count: number;
    categories: Record<string, number>;
    round_types: Record<string, number>;
}>;
export declare const PackSchema: z.ZodObject<{
    pack_id: z.ZodString;
    name: z.ZodString;
    license_note: z.ZodString;
    created_at: z.ZodString;
    stats: z.ZodObject<{
        count: z.ZodNumber;
        categories: z.ZodRecord<z.ZodString, z.ZodNumber>;
        round_types: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        count: number;
        categories: Record<string, number>;
        round_types: Record<string, number>;
    }, {
        count: number;
        categories: Record<string, number>;
        round_types: Record<string, number>;
    }>;
    puzzles: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phrase: z.ZodString;
        category: z.ZodEnum<["PHRASE", "FOOD_AND_DRINK", "PLACE", "WHAT_ARE_YOU_DOING", "BEFORE_AND_AFTER", "SAME_NAME", "TITLE", "PERSON", "EVENT", "AROUND_THE_HOUSE", "THING", "OCCUPATION", "LIVING_THING", "ON_THE_MAP", "FICTIONAL_CHARACTER", "OTHER"]>;
        round_type: z.ZodEnum<["MAIN", "TOSSUP", "BONUS"]>;
        source: z.ZodObject<{
            type: z.ZodString;
            path: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            source_category: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        }, {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        }>;
        normalized: z.ZodObject<{
            phrase: z.ZodString;
            letters: z.ZodArray<z.ZodString, "many">;
            word_count: z.ZodNumber;
            char_count: z.ZodNumber;
            unique_letter_count: z.ZodNumber;
            vowel_ratio: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        }, {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        }>;
        difficulty: z.ZodObject<{
            score: z.ZodNumber;
            reasons: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            score: number;
            reasons: string[];
        }, {
            score: number;
            reasons: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        phrase: string;
        id: string;
        category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
        round_type: "MAIN" | "TOSSUP" | "BONUS";
        source: {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        };
        normalized: {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        };
        difficulty: {
            score: number;
            reasons: string[];
        };
    }, {
        phrase: string;
        id: string;
        category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
        round_type: "MAIN" | "TOSSUP" | "BONUS";
        source: {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        };
        normalized: {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        };
        difficulty: {
            score: number;
            reasons: string[];
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    pack_id: string;
    license_note: string;
    created_at: string;
    stats: {
        count: number;
        categories: Record<string, number>;
        round_types: Record<string, number>;
    };
    puzzles: {
        phrase: string;
        id: string;
        category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
        round_type: "MAIN" | "TOSSUP" | "BONUS";
        source: {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        };
        normalized: {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        };
        difficulty: {
            score: number;
            reasons: string[];
        };
    }[];
}, {
    name: string;
    pack_id: string;
    license_note: string;
    created_at: string;
    stats: {
        count: number;
        categories: Record<string, number>;
        round_types: Record<string, number>;
    };
    puzzles: {
        phrase: string;
        id: string;
        category: "PHRASE" | "FOOD_AND_DRINK" | "PLACE" | "WHAT_ARE_YOU_DOING" | "BEFORE_AND_AFTER" | "SAME_NAME" | "TITLE" | "PERSON" | "EVENT" | "AROUND_THE_HOUSE" | "THING" | "OCCUPATION" | "LIVING_THING" | "ON_THE_MAP" | "FICTIONAL_CHARACTER" | "OTHER";
        round_type: "MAIN" | "TOSSUP" | "BONUS";
        source: {
            type: string;
            path?: string | undefined;
            name?: string | undefined;
            source_category?: string | undefined;
        };
        normalized: {
            phrase: string;
            letters: string[];
            word_count: number;
            char_count: number;
            unique_letter_count: number;
            vowel_ratio: number;
        };
        difficulty: {
            score: number;
            reasons: string[];
        };
    }[];
}>;
export type Pack = z.infer<typeof PackSchema>;
export declare const RawPuzzleSchema: z.ZodObject<{
    phrase: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    round_type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phrase: string;
    category?: string | undefined;
    round_type?: string | undefined;
}, {
    phrase: string;
    category?: string | undefined;
    round_type?: string | undefined;
}>;
export type RawPuzzle = z.infer<typeof RawPuzzleSchema>;
export declare const ReportSchema: z.ZodObject<{
    pack_id: z.ZodString;
    created_at: z.ZodString;
    inputs: z.ZodArray<z.ZodString, "many">;
    total_rows_read: z.ZodNumber;
    valid_puzzles_kept: z.ZodNumber;
    skipped: z.ZodRecord<z.ZodString, z.ZodNumber>;
    duplicates_removed: z.ZodNumber;
    category_distribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    round_type_distribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    hardest: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phrase: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        phrase: string;
        score: number;
        id: string;
    }, {
        phrase: string;
        score: number;
        id: string;
    }>, "many">;
    easiest: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phrase: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        phrase: string;
        score: number;
        id: string;
    }, {
        phrase: string;
        score: number;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    pack_id: string;
    created_at: string;
    inputs: string[];
    total_rows_read: number;
    valid_puzzles_kept: number;
    skipped: Record<string, number>;
    duplicates_removed: number;
    category_distribution: Record<string, number>;
    round_type_distribution: Record<string, number>;
    hardest: {
        phrase: string;
        score: number;
        id: string;
    }[];
    easiest: {
        phrase: string;
        score: number;
        id: string;
    }[];
}, {
    pack_id: string;
    created_at: string;
    inputs: string[];
    total_rows_read: number;
    valid_puzzles_kept: number;
    skipped: Record<string, number>;
    duplicates_removed: number;
    category_distribution: Record<string, number>;
    round_type_distribution: Record<string, number>;
    hardest: {
        phrase: string;
        score: number;
        id: string;
    }[];
    easiest: {
        phrase: string;
        score: number;
        id: string;
    }[];
}>;
export type Report = z.infer<typeof ReportSchema>;
