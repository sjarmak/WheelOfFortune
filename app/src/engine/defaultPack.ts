import originalPack from '../assets/original.json';
import seasonsPack from '../assets/seasons_1_20.json';
import { Puzzle, RoundType } from './types';

// Map the JSON structure to the Engine Puzzle structure
export const DEFAULT_PUZZLES: Puzzle[] = originalPack.puzzles.map((p: any) => ({
  id: p.id,
  phrase: p.phrase,
  category: p.category,
  round_type: p.round_type as RoundType,
  difficulty: p.difficulty,
}));

// Seasons 1-20 pack (12,847 puzzles)
export const SEASONS_1_20_PUZZLES: Puzzle[] = seasonsPack.puzzles.map((p: any) => ({
  id: p.id,
  phrase: p.phrase,
  category: p.category,
  round_type: p.round_type as RoundType,
  difficulty: p.difficulty,
}));

// Combined pack
export const ALL_PUZZLES: Puzzle[] = [...DEFAULT_PUZZLES, ...SEASONS_1_20_PUZZLES];
