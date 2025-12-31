export interface NormalizedPuzzle {
  id: string; // SHA1 hash
  phrase: string; // Original display phrase
  category: string;
  round_type: 'MAIN' | 'TOSSUP' | 'BONUS';
  source: {
    type: string;
    name: string;
    path?: string;
  };
  normalized: {
    phrase: string; // Uppercase, simplified
    letters: string[];
    word_count: number;
    char_count: number;
    unique_letter_count: number;
    vowel_ratio: number;
  };
  difficulty: {
    score: number; // 0.0 to 1.0
    reasons: string[];
  };
}

export interface PuzzlePack {
  pack_id: string;
  name: string;
  license_note: string;
  created_at: string;
  stats: {
    count: number;
    categories: Record<string, number>;
    round_types: Record<string, number>;
  };
  puzzles: NormalizedPuzzle[];
}

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
  'LIVING_THING',
  'ON_THE_MAP',
  'PROPER_NAME',
  'RHYME_TIME',
  'SONG_TITLE',
  'THE_80S',
  'THE_90S',
  'FAMILY',
  'FUN_AND_GAMES',
  'OCCUPATION'
] as const;
