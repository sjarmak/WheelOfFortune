export type RoundType = 'MAIN' | 'TOSSUP' | 'BONUS';

export interface Puzzle {
  id: string;
  phrase: string;
  category: string;
  round_type: RoundType;
}

export type PlayerState = {
  roundScore: number;
  totalScore: number;
  freePlay: boolean;
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
};

export interface WheelWedge {
  id: string;
  type: 'CASH' | 'BANKRUPT' | 'LOSE_TURN' | 'FREE_PLAY';
  value: number;
  label: string;
  color: string;
  weight: number; // For RNG probability if we simulate physics result directly
}

export const WHEEL_CONFIG: WheelWedge[] = [
  { id: '1', type: 'CASH', value: 2500, label: '$2500', color: '#ffecb3', weight: 1 },
  { id: '2', type: 'CASH', value: 500, label: '$500', color: '#d1c4e9', weight: 1 },
  { id: '3', type: 'CASH', value: 900, label: '$900', color: '#ffcdd2', weight: 1 },
  { id: '4', type: 'BANKRUPT', value: 0, label: 'BANKRUPT', color: '#000000', weight: 1 },
  { id: '5', type: 'CASH', value: 600, label: '$600', color: '#c8e6c9', weight: 1 },
  { id: '6', type: 'CASH', value: 400, label: '$400', color: '#fff9c4', weight: 1 },
  { id: '7', type: 'LOSE_TURN', value: 0, label: 'LOSE TURN', color: '#E0E0E0', weight: 1 },
  { id: '8', type: 'CASH', value: 800, label: '$800', color: '#b3e5fc', weight: 1 },
  { id: '9', type: 'CASH', value: 350, label: '$350', color: '#f8bbd0', weight: 1 },
  { id: '10', type: 'FREE_PLAY', value: 500, label: 'FREE PLAY', color: '#FFEB3B', weight: 1 },
  { id: '11', type: 'CASH', value: 700, label: '$700', color: '#ffcc80', weight: 1 },
  { id: '12', type: 'BANKRUPT', value: 0, label: 'BANKRUPT', color: '#000000', weight: 1 },
  { id: '13', type: 'CASH', value: 650, label: '$650', color: '#e1bee7', weight: 1 },
  { id: '14', type: 'CASH', value: 1000, label: '$1000', color: '#ffab91', weight: 1 },
  { id: '15', type: 'CASH', value: 500, label: '$500', color: '#d7ccc8', weight: 1 },
  { id: '16', type: 'CASH', value: 600, label: '$600', color: '#cfd8dc', weight: 1 }
];

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ".split('');
