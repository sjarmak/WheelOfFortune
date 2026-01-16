/**
 * Kid Mode Types
 *
 * Types for the child-friendly game mode with no penalties,
 * hint system, and star-based rewards.
 */

import { TreasureBoxState, INITIAL_TREASURE_STATE } from './shopTypes';

// Re-export treasure types for convenience
export type { TreasureBoxState };
export { INITIAL_TREASURE_STATE };

export type GameMode = 'STANDARD' | 'KID';

/** Kid-friendly wheel outcomes - focused on letter guessing! */
export type KidWedgeOutcomeType =
  | 'GUESS_ANY'       // Guess any letter from full keyboard
  | 'GUESS_TWO'       // Guess TWO letters from keyboard
  | 'VOWEL_PLUS'      // Pick a vowel AND a consonant
  | 'PICK_THREE'      // Pick from 3 suggested letters
  | 'FREE_LETTER'     // Auto-reveal one letter (reward)
  | 'BONUS_STAR'      // Get a bonus star
  | 'HINT_TOKEN';     // Get a free hint

export interface KidWedgeOutcome {
  type: KidWedgeOutcomeType;
  value: number;  // Stars earned or number of guesses
  label: string;
  color: string;
  emoji: string;
}

/** Kid-friendly wheel configuration - lots of guessing opportunities! */
export const KID_WHEEL_CONFIG: KidWedgeOutcome[] = [
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#4CAF50', emoji: '🔤' },
  { type: 'VOWEL_PLUS',   value: 2, label: 'VOWEL+',        color: '#FF6B6B', emoji: '🌟' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#2196F3', emoji: '🔤' },
  { type: 'GUESS_TWO',    value: 2, label: '2 GUESSES',     color: '#00BCD4', emoji: '✌️' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#8BC34A', emoji: '🔤' },
  { type: 'PICK_THREE',   value: 1, label: 'PICK 3',        color: '#673AB7', emoji: '🎯' },
  { type: 'FREE_LETTER',  value: 1, label: 'FREE!',         color: '#FFD700', emoji: '🎁' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#009688', emoji: '🔤' },
  { type: 'VOWEL_PLUS',   value: 2, label: 'VOWEL+',        color: '#E91E63', emoji: '🌟' },
  { type: 'PICK_THREE',   value: 1, label: 'PICK 3',        color: '#9C27B0', emoji: '🎯' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#4DB6AC', emoji: '🔤' },
  { type: 'BONUS_STAR',   value: 1, label: 'STAR!',         color: '#FFC107', emoji: '⭐' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#7CB342', emoji: '🔤' },
  { type: 'HINT_TOKEN',   value: 1, label: 'HINT!',         color: '#3F51B5', emoji: '💡' },
  { type: 'GUESS_ANY',    value: 1, label: 'GUESS!',        color: '#26A69A', emoji: '🔤' },
  { type: 'PICK_THREE',   value: 1, label: 'PICK 3',        color: '#AB47BC', emoji: '🎯' },
];

/** Hint meter configuration */
export const HINT_METER_MAX = 4;

export type HintType =
  | 'REVEAL_CONSONANT'   // Hint 1: reveal a random consonant
  | 'REVEAL_VOWEL'       // Hint 2: reveal a vowel
  | 'REVEAL_FIRST_LETTERS' // Hint 3: reveal first letter of each word
  | 'REVEAL_WORD';       // Hint 4: reveal an entire word

export const HINT_SEQUENCE: HintType[] = [
  'REVEAL_CONSONANT',
  'REVEAL_VOWEL',
  'REVEAL_FIRST_LETTERS',
  'REVEAL_WORD'
];

/** Kid Mode specific state */
export interface KidModeState {
  stars: number;               // Total stars earned this session
  starsThisRound: number;      // Stars earned this round
  hintMeterUsed: number;       // How many hints used this puzzle (0-4)
  hintTokens: number;          // Bonus hint tokens from wheel
  lastOutcome: KidWedgeOutcome | null;  // Last wheel outcome for display
  actionsWithoutProgress: number;  // For "nudge" detection
  letterSuggestions: string[]; // Current 3 suggested letters
  wordBuilderMode: boolean;    // If in word builder solve mode
  currentBuildWord: number;    // Index of word being built
  wordBuilderInput: string[];  // Letters entered for current word
  guessesRemaining: number;    // For GUESS_TWO: how many guesses left
  vowelPlusPhase: 'vowel' | 'consonant' | null;  // For VOWEL_PLUS: which phase
  treasure: TreasureBoxState;  // Owned items, equipped customizations, achievements
}

export const INITIAL_KID_STATE: KidModeState = {
  stars: 0,
  starsThisRound: 0,
  hintMeterUsed: 0,
  hintTokens: 0,
  lastOutcome: null,
  actionsWithoutProgress: 0,
  letterSuggestions: [],
  wordBuilderMode: false,
  currentBuildWord: 0,
  wordBuilderInput: [],
  guessesRemaining: 0,
  vowelPlusPhase: null,
  treasure: INITIAL_TREASURE_STATE,
};

export const CASH_PER_STAR = 100;

/** Kid Mode settings */
export interface KidModeSettings {
  readAloud: boolean;           // TTS enabled
  maxLetters: number;           // Puzzle max letters (default 25)
  maxWordLength: number;        // Max word length (default 6)
  showNudgeAfterActions: number; // Show hint nudge after N actions (default 3)
}

export const DEFAULT_KID_SETTINGS: KidModeSettings = {
  readAloud: true,
  maxLetters: 18,
  maxWordLength: 5,
  showNudgeAfterActions: 3
};

/** Kid puzzle pack categories */
export const KID_CATEGORIES = [
  'ANIMALS',
  'FOOD',
  'FAMILY',
  'COLORS',
  'ACTIONS',
  'SIMPLE_PHRASES',
  'PLACES',
  'THINGS',
  'FUN_WORDS'
] as const;

export type KidCategory = typeof KID_CATEGORIES[number];

/** Extended puzzle interface with kid-friendly tags */
export interface KidPuzzle {
  id: string;
  phrase: string;
  category: KidCategory;
  tags?: string[];
  readingLevel?: 'EASY' | 'MEDIUM';
}
