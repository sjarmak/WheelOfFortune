import originalPack from '../assets/original.json';
import { Puzzle, RoundType } from './types';

// Map the JSON structure to the Engine Puzzle structure
export const DEFAULT_PUZZLES: Puzzle[] = originalPack.puzzles.map((p: any) => ({
  id: p.id,
  phrase: p.phrase,
  category: p.category,
  round_type: p.round_type as RoundType
}));
