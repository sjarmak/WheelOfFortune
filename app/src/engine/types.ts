export type RoundType = 'MAIN' | 'TOSSUP' | 'BONUS';

/** Game mode - Standard (adult) or Kid */
export type GameMode = 'STANDARD' | 'KID';

export interface PuzzleDifficulty {
  score: number;
  reasons: string[];
}

export interface Puzzle {
  id: string;
  phrase: string;
  category: string;
  round_type: RoundType;
  difficulty?: PuzzleDifficulty;
  season?: number;
}

export type PlayerState = {
  currentRoundScore: number;
  totalScore: number;
};

export type GameState = {
  currentPuzzle: Puzzle | null;
  guessedLetters: string[]; // All guesses
  revealedPositions: number[]; // Indices of letters visible
  
  // Turn state
  spinResult: string | number | null; // 'BANKRUPT', 'LOSE_TURN', or cash value
  turnState: 'IDLE' | 'SPINNING' | 'GUESSING_CONSONANT' | 'BUYING_VOWEL' | 'SOLVING' | 'ROUND_OVER';
  
  player: PlayerState;
  
  // Toss-up specific
  tossUpRevealOrder: number[];
  tossUpIndex: number; // How many revealed so far
  
  // Bonus specific
  bonusTimer: number;
  bonusPicks: string[]; // RSTLNE + 3 + 1
  
  // Meta
  packId: string;
  seed: number;
  roundCount: number;
  spinCount: number; // Number of spins in current round (for RNG variation)
};

export interface WheelWedge {
  id: string;
  type: 'VALUE' | 'BANKRUPT' | 'LOSE_TURN';
  value: number;
  label: string;
  color: string;
}

// Authentic 24-wedge Wheel of Fortune layout (Round 1 configuration)
// Colors based on actual show: Red, Orange, Yellow, Green, Blue, Purple, Pink
const RED = '#CF3030';
const ORANGE = '#E58432';
const YELLOW = '#D2D456';
const GREEN = '#9CCF57';
const BLUE = '#88BBF7';
const PURPLE = '#9966CC';
const PINK = '#E57BA2';

export const WHEEL_CONFIG: WheelWedge[] = [
  { id: '1',  type: 'VALUE', value: 2500, label: '$2500',       color: YELLOW },   // Top dollar - Gold/Yellow
  { id: '2',  type: 'VALUE', value: 600,  label: '$600',        color: PURPLE },
  { id: '3',  type: 'VALUE', value: 700,  label: '$700',        color: ORANGE },
  { id: '4',  type: 'VALUE', value: 600,  label: '$600',        color: PINK },
  { id: '5',  type: 'VALUE', value: 650,  label: '$650',        color: BLUE },
  { id: '6',  type: 'BANKRUPT',  value: 0,    label: 'BANKRUPT',    color: '#000000' },
  { id: '7',  type: 'VALUE', value: 500,  label: '$500',        color: GREEN },
  { id: '8',  type: 'VALUE', value: 800,  label: '$800',        color: RED },
  { id: '9',  type: 'VALUE', value: 550,  label: '$550',        color: PURPLE },
  { id: '10', type: 'VALUE', value: 500,  label: '$500',        color: YELLOW },
  { id: '11', type: 'VALUE', value: 900,  label: '$900',        color: BLUE },
  { id: '12', type: 'VALUE', value: 500,  label: '$500',        color: GREEN },
  { id: '13', type: 'VALUE', value: 700,  label: '$700',        color: PINK },
  { id: '14', type: 'VALUE', value: 600,  label: '$600',        color: BLUE },
  { id: '15', type: 'VALUE', value: 800,  label: '$800',        color: ORANGE },
  { id: '16', type: 'LOSE_TURN', value: 0,    label: 'LOSE A TURN', color: '#FFFFFF' },
  { id: '17', type: 'VALUE', value: 650,  label: '$650',        color: GREEN },
  { id: '18', type: 'VALUE', value: 500,  label: '$500',        color: PURPLE },
  { id: '19', type: 'VALUE', value: 900,  label: '$900',        color: YELLOW },
  { id: '20', type: 'BANKRUPT',  value: 0,    label: 'BANKRUPT',    color: '#000000' },
  { id: '21', type: 'VALUE', value: 500,  label: '$500',        color: RED },
  { id: '22', type: 'VALUE', value: 850,  label: '$850',        color: BLUE },
  { id: '23', type: 'VALUE', value: 700,  label: '$700',        color: GREEN },
  { id: '24', type: 'VALUE', value: 600,  label: '$600',        color: PINK },
];

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ".split('');
