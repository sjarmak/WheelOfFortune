import originalPack from '../assets/original.json';
import seasonsPack from '../assets/seasons_1_20.json';
import seasons40_42Pack from '../assets/seasons_40_42_all.json';
import { Puzzle, RoundType } from './types';

export interface PuzzlePack {
  id: string;
  name: string;
  description: string;
  source: string;
  puzzleCount: number;
  categories: string[];
  difficultyRange: [number, number];
  puzzles: Puzzle[];
}

function extractSeason(sourcePath: string): number | undefined {
  const match = sourcePath.match(/season_(\d+)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

function mapPuzzles(raw: any[]): Puzzle[] {
  return raw.map((p: any) => ({
    id: p.id,
    phrase: p.phrase,
    category: p.category,
    round_type: p.round_type as RoundType,
    difficulty: p.difficulty,
    season: extractSeason(p.source?.path || ''),
  }));
}

function computePackStats(puzzles: Puzzle[]): { categories: string[]; difficultyRange: [number, number] } {
  const categories = [...new Set(puzzles.map(p => p.category))];
  const difficulties = puzzles.map(p => p.difficulty?.score ?? 0.5);
  const min = Math.min(...difficulties);
  const max = Math.max(...difficulties);
  return { categories, difficultyRange: [min, max] };
}

// Create individual season packs
function createSeasonPacks(
  puzzles: Puzzle[],
  seasonNumbers: number[]
): PuzzlePack[] {
  const packs: PuzzlePack[] = [];
  
  for (const season of seasonNumbers.sort((a, b) => a - b)) {
    const seasonPuzzles = puzzles.filter(p => p.season === season);
    if (seasonPuzzles.length === 0) continue;
    
    const stats = computePackStats(seasonPuzzles);
    packs.push({
      id: `season-${season}`,
      name: `Season ${season}`,
      description: `${seasonPuzzles.length} puzzles from Season ${season}`,
      source: `season_${season}`,
      puzzleCount: seasonPuzzles.length,
      ...stats,
      puzzles: seasonPuzzles,
    });
  }
  
  return packs;
}

// Create difficulty-based sub-packs from a large puzzle set
function createDifficultyPacks(
  puzzles: Puzzle[],
  source: string,
  baseName: string
): PuzzlePack[] {
  const easy = puzzles.filter(p => (p.difficulty?.score ?? 0.5) < 0.3);
  const medium = puzzles.filter(p => {
    const score = p.difficulty?.score ?? 0.5;
    return score >= 0.3 && score < 0.5;
  });
  const hard = puzzles.filter(p => (p.difficulty?.score ?? 0.5) >= 0.5);

  const packs: PuzzlePack[] = [];

  if (easy.length > 0) {
    const stats = computePackStats(easy);
    packs.push({
      id: `${source}-easy`,
      name: `${baseName} - Easy`,
      description: `Easier puzzles from ${baseName}`,
      source,
      puzzleCount: easy.length,
      ...stats,
      puzzles: easy,
    });
  }

  if (medium.length > 0) {
    const stats = computePackStats(medium);
    packs.push({
      id: `${source}-medium`,
      name: `${baseName} - Medium`,
      description: `Medium difficulty puzzles from ${baseName}`,
      source,
      puzzleCount: medium.length,
      ...stats,
      puzzles: medium,
    });
  }

  if (hard.length > 0) {
    const stats = computePackStats(hard);
    packs.push({
      id: `${source}-hard`,
      name: `${baseName} - Hard`,
      description: `Challenging puzzles from ${baseName}`,
      source,
      puzzleCount: hard.length,
      ...stats,
      puzzles: hard,
    });
  }

  return packs;
}

// Build all available packs
function buildPacks(): PuzzlePack[] {
  const packs: PuzzlePack[] = [];

  // Original practice pack
  const originalPuzzles = mapPuzzles(originalPack.puzzles);
  const originalStats = computePackStats(originalPuzzles);
  packs.push({
    id: 'original',
    name: 'Practice Pack',
    description: 'Starter puzzles for practice',
    source: 'original',
    puzzleCount: originalPuzzles.length,
    ...originalStats,
    puzzles: originalPuzzles,
  });

  // Seasons 1-20 full pack (from GitHub WOF1-20)
  const seasonsPuzzles = mapPuzzles(seasonsPack.puzzles);
  const seasonsStats = computePackStats(seasonsPuzzles);
  packs.push({
    id: 'seasons-1-20-all',
    name: 'Seasons 1-20 (Classic)',
    description: '12,847 puzzles from classic TV seasons 1-20',
    source: 'seasons_1_20',
    puzzleCount: seasonsPuzzles.length,
    ...seasonsStats,
    puzzles: seasonsPuzzles,
  });

  // Seasons 40-42 (recent, with proper categories)
  const seasons40_42Puzzles = mapPuzzles(seasons40_42Pack.puzzles);
  const seasons40_42Stats = computePackStats(seasons40_42Puzzles);
  packs.push({
    id: 'seasons-40-42',
    name: 'Seasons 40-42 (2022-2025)',
    description: '5,724 recent puzzles with categories',
    source: 'seasons_40_42',
    puzzleCount: seasons40_42Puzzles.length,
    ...seasons40_42Stats,
    puzzles: seasons40_42Puzzles,
  });

  // Individual season packs for Seasons 40-42 (metadata available in source)
  packs.push(...createSeasonPacks(seasons40_42Puzzles, [40, 41, 42]));

  // Difficulty-based sub-packs for recent seasons
  packs.push(...createDifficultyPacks(seasons40_42Puzzles, 'seasons_40_42', 'Recent'));

  // Random sample packs for quick games
  const shuffled = [...seasonsPuzzles].sort(() => Math.random() - 0.5);
  
  packs.push({
    id: 'quick-10',
    name: 'Quick Game (10)',
    description: '10 random puzzles for a quick game',
    source: 'random',
    puzzleCount: 10,
    categories: ['MIXED'],
    difficultyRange: [0, 1],
    puzzles: shuffled.slice(0, 10),
  });

  packs.push({
    id: 'quick-25',
    name: 'Quick Game (25)',
    description: '25 random puzzles',
    source: 'random',
    puzzleCount: 25,
    categories: ['MIXED'],
    difficultyRange: [0, 1],
    puzzles: shuffled.slice(0, 25),
  });

  packs.push({
    id: 'quick-50',
    name: 'Quick Game (50)',
    description: '50 random puzzles for a longer session',
    source: 'random',
    puzzleCount: 50,
    categories: ['MIXED'],
    difficultyRange: [0, 1],
    puzzles: shuffled.slice(0, 50),
  });

  return packs;
}

export const ALL_PACKS = buildPacks();

export function getPackById(id: string): PuzzlePack | undefined {
  return ALL_PACKS.find(p => p.id === id);
}
