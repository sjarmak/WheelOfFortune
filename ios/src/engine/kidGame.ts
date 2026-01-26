/**
 * Kid Mode Game Reducer
 *
 * Implements child-friendly game logic with:
 * - No penalties (BANKRUPT/LOSE_TURN become positive outcomes)
 * - Star-based rewards instead of money
 * - Hint meter system (4 levels)
 * - Positive feedback for all actions
 */

import { Puzzle } from './types';
import { SeededRNG } from './rng';
import {
  KidModeState,
  KidWedgeOutcome,
  KID_WHEEL_CONFIG,
  INITIAL_KID_STATE,
  HINT_SEQUENCE,
  HINT_METER_MAX,
  HintType,
  CASH_PER_STAR
} from './kidTypes';
import {
  getSuggestedLetters,
  getUnrevealedConsonants,
  getUnrevealedVowels,
  getFirstLetterPositions,
  getWordPositions
} from './letterSuggestions';
import {
  getShopItem,
  getNewAchievements,
  ShopCategory
} from './shopTypes';

/** Kid Mode turn states */
export type KidTurnState =
  | 'IDLE'
  | 'SPINNING'
  | 'CHOOSING_LETTER'       // After PICK_THREE outcome
  | 'GUESSING_LETTER'       // Normal letter guess
  | 'PICKING_VOWEL'         // VOWEL_PLUS: picking vowel first
  | 'PICKING_CONSONANT'     // VOWEL_PLUS: picking consonant second
  | 'WORD_BUILDER'          // Word builder solve mode
  | 'SHOWING_OUTCOME'       // Displaying wheel outcome
  | 'ROUND_OVER';

/** Kid Mode game state */
export interface KidGameState {
  currentPuzzle: Puzzle | null;
  guessedLetters: string[];
  revealedPositions: number[];

  turnState: KidTurnState;
  kidState: KidModeState;

  // Meta
  packId: string;
  seed: number;
  roundCount: number;
  spinCount: number;
}

/** Initial Kid Mode state */
export const INITIAL_KID_GAME_STATE: KidGameState = {
  currentPuzzle: null,
  guessedLetters: [],
  revealedPositions: [],
  turnState: 'IDLE',
  kidState: { ...INITIAL_KID_STATE },
  packId: 'kid-pack',
  seed: Date.now(),
  roundCount: 0,
  spinCount: 0
};

/** Kid Mode actions */
export type KidGameAction =
  | { type: 'KID_START_ROUND'; puzzle: Puzzle; seed?: number }
  | { type: 'KID_SPIN_WHEEL' }
  | { type: 'KID_SPIN_RESULT'; outcome: KidWedgeOutcome }
  | { type: 'KID_DISMISS_OUTCOME' }
  | { type: 'KID_GUESS_LETTER'; letter: string }
  | { type: 'KID_USE_HINT' }
  | { type: 'KID_UPDATE_SUGGESTIONS'; seed: number }
  | { type: 'KID_ENTER_WORD_BUILDER' }
  | { type: 'KID_EXIT_WORD_BUILDER' }
  | { type: 'KID_WORD_BUILDER_INPUT'; letter: string }
  | { type: 'KID_WORD_BUILDER_CLEAR' }
  | { type: 'KID_WORD_BUILDER_CHECK' }
  | { type: 'KID_WORD_BUILDER_NEXT_WORD' }
  | { type: 'KID_SOLVE_PUZZLE' }
  | { type: 'KID_RESET_GAME' }
  // Treasure box actions
  | { type: 'KID_BUY_ITEM'; itemId: string }
  | { type: 'KID_EQUIP_ITEM'; itemId: string; category: ShopCategory }
  | { type: 'KID_UNEQUIP_ITEM'; category: ShopCategory }
  | { type: 'KID_CLAIM_ACHIEVEMENT'; achievementId: string; rewardItemIds: string[] }
  | { type: 'KID_HYDRATE_STATE'; state: Partial<KidGameState> };

/**
 * Get deterministic wheel outcome based on seed
 */
export function getKidWheelOutcome(seed: number): KidWedgeOutcome {
  const rng = new SeededRNG(seed);
  const index = rng.range(0, KID_WHEEL_CONFIG.length);
  return KID_WHEEL_CONFIG[index];
}

/**
 * Reveal random unrevealed letter positions
 */
function revealRandomLetters(
  phrase: string,
  revealedPositions: number[],
  guessedLetters: string[],
  count: number,
  seed: number
): { newRevealed: number[]; newGuessed: string[] } {
  const rng = new SeededRNG(seed);
  const upperPhrase = phrase.toUpperCase();

  // Find unrevealed letter positions
  const unrevealed: number[] = [];
  for (let i = 0; i < upperPhrase.length; i++) {
    if (/[A-Z]/.test(upperPhrase[i]) && !revealedPositions.includes(i)) {
      unrevealed.push(i);
    }
  }

  if (unrevealed.length === 0) {
    return { newRevealed: [...revealedPositions], newGuessed: [...guessedLetters] };
  }

  // Shuffle and pick
  const shuffled = rng.shuffle(unrevealed);
  const toReveal = shuffled.slice(0, Math.min(count, shuffled.length));

  // Find all positions with the same letters
  const newRevealed = [...revealedPositions];
  const newGuessed = [...guessedLetters];
  const lettersRevealed = new Set<string>();

  for (const pos of toReveal) {
    const letter = upperPhrase[pos];
    lettersRevealed.add(letter);
  }

  // Reveal ALL instances of the revealed letters
  for (let i = 0; i < upperPhrase.length; i++) {
    if (lettersRevealed.has(upperPhrase[i]) && !newRevealed.includes(i)) {
      newRevealed.push(i);
    }
  }

  // Add to guessed letters
  for (const letter of lettersRevealed) {
    if (!newGuessed.includes(letter)) {
      newGuessed.push(letter);
    }
  }

  return { newRevealed, newGuessed };
}

/**
 * Apply hint based on hint type
 */
function applyHint(
  hintType: HintType,
  phrase: string,
  revealedPositions: number[],
  guessedLetters: string[],
  seed: number
): { newRevealed: number[]; newGuessed: string[] } {
  const rng = new SeededRNG(seed);
  const upperPhrase = phrase.toUpperCase();

  switch (hintType) {
    case 'REVEAL_CONSONANT': {
      const consonants = getUnrevealedConsonants(phrase, guessedLetters);
      if (consonants.length === 0) {
        return { newRevealed: [...revealedPositions], newGuessed: [...guessedLetters] };
      }
      const letter = consonants[rng.range(0, consonants.length)];
      return revealLetter(upperPhrase, revealedPositions, guessedLetters, letter);
    }

    case 'REVEAL_VOWEL': {
      const vowels = getUnrevealedVowels(phrase, guessedLetters);
      if (vowels.length === 0) {
        return { newRevealed: [...revealedPositions], newGuessed: [...guessedLetters] };
      }
      const letter = vowels[rng.range(0, vowels.length)];
      return revealLetter(upperPhrase, revealedPositions, guessedLetters, letter);
    }

    case 'REVEAL_FIRST_LETTERS': {
      const firstPositions = getFirstLetterPositions(phrase);
      const newRevealed = [...revealedPositions];
      const newGuessed = [...guessedLetters];

      for (const pos of firstPositions) {
        if (!newRevealed.includes(pos)) {
          newRevealed.push(pos);
          const letter = upperPhrase[pos];
          if (!newGuessed.includes(letter)) {
            newGuessed.push(letter);
          }
        }
      }
      return { newRevealed, newGuessed };
    }

    case 'REVEAL_WORD': {
      // Find an unrevealed word
      const words = phrase.split(' ');
      let charIndex = 0;
      const unrevealedWords: number[] = [];

      for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
        const word = words[wordIdx];
        let hasUnrevealed = false;

        for (let i = 0; i < word.length; i++) {
          if (/[A-Z]/i.test(word[i]) && !revealedPositions.includes(charIndex + i)) {
            hasUnrevealed = true;
            break;
          }
        }

        if (hasUnrevealed) {
          unrevealedWords.push(wordIdx);
        }
        charIndex += word.length + 1;
      }

      if (unrevealedWords.length === 0) {
        return { newRevealed: [...revealedPositions], newGuessed: [...guessedLetters] };
      }

      // Pick a random unrevealed word
      const wordIdx = unrevealedWords[rng.range(0, unrevealedWords.length)];
      const { positions } = getWordPositions(phrase, wordIdx);

      const newRevealed = [...revealedPositions];
      const newGuessed = [...guessedLetters];

      for (const pos of positions) {
        if (!newRevealed.includes(pos)) {
          newRevealed.push(pos);
          const letter = upperPhrase[pos];
          if (!newGuessed.includes(letter)) {
            newGuessed.push(letter);
          }
        }
      }

      return { newRevealed, newGuessed };
    }

    default:
      return { newRevealed: [...revealedPositions], newGuessed: [...guessedLetters] };
  }
}

/**
 * Reveal all instances of a specific letter
 */
function revealLetter(
  phrase: string,
  revealedPositions: number[],
  guessedLetters: string[],
  letter: string
): { newRevealed: number[]; newGuessed: string[] } {
  const upper = letter.toUpperCase();
  const newRevealed = [...revealedPositions];
  const newGuessed = [...guessedLetters];

  for (let i = 0; i < phrase.length; i++) {
    if (phrase[i].toUpperCase() === upper && !newRevealed.includes(i)) {
      newRevealed.push(i);
    }
  }

  if (!newGuessed.includes(upper)) {
    newGuessed.push(upper);
  }

  return { newRevealed, newGuessed };
}

/**
 * Check if puzzle is fully solved
 */
function isPuzzleSolved(phrase: string, revealedPositions: number[]): boolean {
  for (let i = 0; i < phrase.length; i++) {
    if (/[A-Z]/i.test(phrase[i]) && !revealedPositions.includes(i)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate stars earned for completing a puzzle
 */
function calculateCompletionStars(
  _phrase: string,
  hintsUsed: number,
  roundStars: number
): number {
  const baseStars = 5;
  const hintPenalty = hintsUsed; // Lose 1 star per hint used
  const bonusStars = roundStars;

  return Math.max(1, baseStars - hintPenalty + Math.floor(bonusStars / 2));
}

/**
 * Kid Mode game reducer
 */
export function kidGameReducer(
  state: KidGameState,
  action: KidGameAction
): KidGameState {
  switch (action.type) {
    case 'KID_START_ROUND': {
      const { puzzle, seed } = action;

      // Generate initial suggestions
      const suggestionsSeed = seed ?? state.seed + state.roundCount;
      const suggestions = getSuggestedLetters(puzzle.phrase, [], [], 3, suggestionsSeed);

      return {
        ...state,
        currentPuzzle: puzzle,
        guessedLetters: [],
        revealedPositions: [],
        turnState: 'IDLE',
        kidState: {
          ...INITIAL_KID_STATE,
          stars: state.kidState.stars, // Keep total stars
          treasure: state.kidState.treasure, // Keep treasure box
          hintTokens: state.kidState.hintTokens, // Keep hint tokens
          letterSuggestions: suggestions
        },
        roundCount: state.roundCount + 1,
        spinCount: 0,
        seed: seed ?? state.seed
      };
    }

    case 'KID_SPIN_WHEEL':
      return {
        ...state,
        turnState: 'SPINNING',
        spinCount: state.spinCount + 1
      };

    case 'KID_SPIN_RESULT': {
      const { outcome } = action;
      const puzzle = state.currentPuzzle!;
      let newState = { ...state };
      let newKidState = { ...state.kidState };

      switch (outcome.type) {
        case 'GUESS_ANY': {
          // Kid gets to guess one letter from keyboard
          newKidState.guessesRemaining = 1;
          break;
        }

        case 'GUESS_TWO': {
          // Kid gets to guess TWO letters from keyboard
          newKidState.guessesRemaining = 2;
          break;
        }

        case 'VOWEL_PLUS': {
          // Kid picks a vowel first, then a consonant
          // But if all vowels are already used, give a hint instead
          const unrevealedVowels = getUnrevealedVowels(puzzle.phrase, state.guessedLetters);
          if (unrevealedVowels.length === 0) {
            // All vowels already guessed - apply hint instead
            const tempState = { ...newState, kidState: newKidState };
            const hintType = getCurrentHintType(tempState);
            if (hintType) {
              const { newRevealed, newGuessed } = applyHint(
                hintType,
                puzzle.phrase,
                newState.revealedPositions,
                newState.guessedLetters,
                state.seed + state.spinCount
              );
              newState.revealedPositions = newRevealed;
              newState.guessedLetters = newGuessed;
              newKidState.hintMeterUsed = newKidState.hintMeterUsed + 1;
            }
            newKidState.vowelPlusPhase = null;
          } else {
            // Vowels available - let kid pick one
            newKidState.vowelPlusPhase = 'vowel';
          }
          break;
        }

        case 'PICK_THREE': {
          // Update suggestions for pick three
          const suggestions = getSuggestedLetters(
            puzzle.phrase,
            state.guessedLetters,
            state.revealedPositions,
            3,
            state.seed + state.spinCount
          );
          newKidState.letterSuggestions = suggestions;
          newKidState.guessesRemaining = 1;
          break;
        }

        case 'FREE_LETTER': {
          // Auto-reveal one random letter as a reward
          const { newRevealed, newGuessed } = revealRandomLetters(
            puzzle.phrase,
            state.revealedPositions,
            state.guessedLetters,
            1,
            state.seed + state.spinCount
          );

          newState.revealedPositions = newRevealed;
          newState.guessedLetters = newGuessed;
          newKidState.starsThisRound += 1;
          newKidState.actionsWithoutProgress = 0;
          break;
        }

        case 'BONUS_STAR':
          newKidState.starsThisRound += outcome.value;
          break;

        case 'HINT_TOKEN':
          newKidState.hintTokens += 1;
          break;

        case 'MONEY': {
          // For money: present 3 letters to choose from (like PICK_THREE)
          // If they guess correctly, they get money converted to stars
          const suggestions = getSuggestedLetters(
            puzzle.phrase,
            state.guessedLetters,
            state.revealedPositions,
            3,
            state.seed + state.spinCount
          );
          newKidState.letterSuggestions = suggestions;
          newKidState.guessesRemaining = 1;
          break;
        }
      }

      newKidState.lastOutcome = outcome;

      // Check if puzzle is solved after reveal
      const solved = isPuzzleSolved(puzzle.phrase, newState.revealedPositions);

      return {
        ...newState,
        turnState: solved ? 'ROUND_OVER' : 'SHOWING_OUTCOME',
        kidState: newKidState
      };
    }

    case 'KID_DISMISS_OUTCOME': {
      const outcome = state.kidState.lastOutcome;

      // Determine next state based on outcome
      if (outcome?.type === 'PICK_THREE' || outcome?.type === 'MONEY') {
        return {
          ...state,
          turnState: 'CHOOSING_LETTER',
          kidState: {
            ...state.kidState,
            lastOutcome: null
          }
        };
      }

      if (outcome?.type === 'GUESS_ANY' || outcome?.type === 'GUESS_TWO') {
        return {
          ...state,
          turnState: 'GUESSING_LETTER',
          kidState: {
            ...state.kidState,
            lastOutcome: null
          }
        };
      }

      if (outcome?.type === 'VOWEL_PLUS') {
        return {
          ...state,
          turnState: 'PICKING_VOWEL',
          kidState: {
            ...state.kidState,
            lastOutcome: null,
            vowelPlusPhase: 'vowel'
          }
        };
      }

      // For FREE_LETTER, BONUS_STAR, HINT_TOKEN - go back to IDLE
      return {
        ...state,
        turnState: 'IDLE',
        kidState: {
          ...state.kidState,
          lastOutcome: null,
          guessesRemaining: 0,
          vowelPlusPhase: null
        }
      };
    }

    case 'KID_GUESS_LETTER': {
      const { letter } = action;
      const puzzle = state.currentPuzzle!;
      const upper = letter.toUpperCase();
      const isVowel = 'AEIOU'.includes(upper);

      // Prevent duplicate guesses
      if (state.guessedLetters.includes(upper)) {
        return state;
      }

      // For VOWEL_PLUS: validate the guess matches the phase
      if (state.turnState === 'PICKING_VOWEL' && !isVowel) {
        return state; // Must pick a vowel
      }
      if (state.turnState === 'PICKING_CONSONANT' && isVowel) {
        return state; // Must pick a consonant
      }

      const { newRevealed, newGuessed } = revealLetter(
        puzzle.phrase,
        state.revealedPositions,
        state.guessedLetters,
        upper
      );

      // Check if letter was in puzzle
      const wasInPuzzle = newRevealed.length > state.revealedPositions.length;
      const lettersRevealed = newRevealed.length - state.revealedPositions.length;

      // Update actions without progress
      const actionsWithoutProgress = wasInPuzzle
        ? 0
        : state.kidState.actionsWithoutProgress + 1;

      // Award star for finding letters
      let starsEarned = wasInPuzzle ? Math.ceil(lettersRevealed / 2) : 0;

      // If this was a MONEY outcome and they guessed correctly, award the money
      const lastOutcome = state.kidState.lastOutcome;
      if (state.turnState === 'CHOOSING_LETTER' && lastOutcome?.type === 'MONEY' && wasInPuzzle) {
        const moneyAsStars = Math.floor(lastOutcome.value / 100);
        starsEarned += moneyAsStars;
      }

      // Update suggestions
      const suggestions = getSuggestedLetters(
        puzzle.phrase,
        newGuessed,
        newRevealed,
        3,
        state.seed + state.spinCount + newGuessed.length
      );

      // Check if solved
      const solved = isPuzzleSolved(puzzle.phrase, newRevealed);

      // Handle guessesRemaining for GUESS_TWO
      const guessesRemaining = Math.max(0, state.kidState.guessesRemaining - 1);

      // Determine next turn state
      let nextTurnState: KidTurnState;
      let nextVowelPlusPhase = state.kidState.vowelPlusPhase;

      if (solved) {
        nextTurnState = 'ROUND_OVER';
        nextVowelPlusPhase = null;
      } else if (state.turnState === 'PICKING_VOWEL') {
        // After picking vowel, move to consonant phase
        nextTurnState = 'PICKING_CONSONANT';
        nextVowelPlusPhase = 'consonant';
      } else if (state.turnState === 'PICKING_CONSONANT') {
        // Done with VOWEL_PLUS
        nextTurnState = 'IDLE';
        nextVowelPlusPhase = null;
      } else if (guessesRemaining > 0) {
        // Still have guesses left
        nextTurnState = 'GUESSING_LETTER';
      } else {
        nextTurnState = 'IDLE';
      }

      return {
        ...state,
        guessedLetters: newGuessed,
        revealedPositions: newRevealed,
        turnState: nextTurnState,
        kidState: {
          ...state.kidState,
          starsThisRound: state.kidState.starsThisRound + starsEarned,
          actionsWithoutProgress,
          letterSuggestions: suggestions,
          lastOutcome: null,
          guessesRemaining,
          vowelPlusPhase: nextVowelPlusPhase
        }
      };
    }

    case 'KID_USE_HINT': {
      const puzzle = state.currentPuzzle!;
      const hintIndex = state.kidState.hintMeterUsed;

      // Check if hints available
      if (hintIndex >= HINT_METER_MAX) {
        return state;
      }

      // Check if using a hint token (free) or regular hint
      const usingToken = state.kidState.hintTokens > 0 && hintIndex > 0;

      const hintType = HINT_SEQUENCE[hintIndex];
      const { newRevealed, newGuessed } = applyHint(
        hintType,
        puzzle.phrase,
        state.revealedPositions,
        state.guessedLetters,
        state.seed + state.spinCount + hintIndex
      );

      // Update suggestions
      const suggestions = getSuggestedLetters(
        puzzle.phrase,
        newGuessed,
        newRevealed,
        3,
        state.seed + state.spinCount + newGuessed.length
      );

      // Check if solved
      const solved = isPuzzleSolved(puzzle.phrase, newRevealed);

      return {
        ...state,
        guessedLetters: newGuessed,
        revealedPositions: newRevealed,
        turnState: solved ? 'ROUND_OVER' : 'IDLE',
        kidState: {
          ...state.kidState,
          hintMeterUsed: hintIndex + 1,
          hintTokens: usingToken ? state.kidState.hintTokens - 1 : state.kidState.hintTokens,
          letterSuggestions: suggestions,
          actionsWithoutProgress: 0
        }
      };
    }

    case 'KID_UPDATE_SUGGESTIONS': {
      const puzzle = state.currentPuzzle;
      if (!puzzle) return state;

      const suggestions = getSuggestedLetters(
        puzzle.phrase,
        state.guessedLetters,
        state.revealedPositions,
        3,
        action.seed
      );

      return {
        ...state,
        kidState: {
          ...state.kidState,
          letterSuggestions: suggestions
        }
      };
    }

    case 'KID_ENTER_WORD_BUILDER': {
      return {
        ...state,
        turnState: 'WORD_BUILDER',
        kidState: {
          ...state.kidState,
          wordBuilderMode: true,
          currentBuildWord: 0,
          wordBuilderInput: []
        }
      };
    }

    case 'KID_EXIT_WORD_BUILDER': {
      return {
        ...state,
        turnState: 'IDLE',
        kidState: {
          ...state.kidState,
          wordBuilderMode: false,
          currentBuildWord: 0,
          wordBuilderInput: []
        }
      };
    }

    case 'KID_WORD_BUILDER_INPUT': {
      const { letter } = action;
      return {
        ...state,
        kidState: {
          ...state.kidState,
          wordBuilderInput: [...state.kidState.wordBuilderInput, letter.toUpperCase()]
        }
      };
    }

    case 'KID_WORD_BUILDER_CLEAR': {
      return {
        ...state,
        kidState: {
          ...state.kidState,
          wordBuilderInput: []
        }
      };
    }

    case 'KID_WORD_BUILDER_CHECK': {
      const puzzle = state.currentPuzzle!;
      const words = puzzle.phrase.split(' ');
      const currentWordIdx = state.kidState.currentBuildWord;

      if (currentWordIdx >= words.length) {
        return state;
      }

      const targetWord = words[currentWordIdx].toUpperCase().replace(/[^A-Z]/g, '');
      const inputWord = state.kidState.wordBuilderInput.join('');

      if (inputWord === targetWord) {
        // Correct! Reveal the word
        const { positions } = getWordPositions(puzzle.phrase, currentWordIdx);
        const newRevealed = [...state.revealedPositions];
        const newGuessed = [...state.guessedLetters];

        for (const pos of positions) {
          if (!newRevealed.includes(pos)) {
            newRevealed.push(pos);
          }
          const letter = puzzle.phrase[pos].toUpperCase();
          if (!newGuessed.includes(letter)) {
            newGuessed.push(letter);
          }
        }

        // Check if all words complete
        const solved = isPuzzleSolved(puzzle.phrase, newRevealed);

        return {
          ...state,
          revealedPositions: newRevealed,
          guessedLetters: newGuessed,
          turnState: solved ? 'ROUND_OVER' : 'WORD_BUILDER',
          kidState: {
            ...state.kidState,
            currentBuildWord: currentWordIdx + 1,
            wordBuilderInput: [],
            starsThisRound: state.kidState.starsThisRound + 2
          }
        };
      }

      // Wrong - just clear input (no penalty)
      return {
        ...state,
        kidState: {
          ...state.kidState,
          wordBuilderInput: []
        }
      };
    }

    case 'KID_WORD_BUILDER_NEXT_WORD': {
      const puzzle = state.currentPuzzle!;
      const words = puzzle.phrase.split(' ');
      const nextWord = state.kidState.currentBuildWord + 1;

      if (nextWord >= words.length) {
        return state;
      }

      return {
        ...state,
        kidState: {
          ...state.kidState,
          currentBuildWord: nextWord,
          wordBuilderInput: []
        }
      };
    }

    case 'KID_SOLVE_PUZZLE': {
      const puzzle = state.currentPuzzle!;

      // Reveal all letters
      const newRevealed: number[] = [];
      for (let i = 0; i < puzzle.phrase.length; i++) {
        newRevealed.push(i);
      }

      // Calculate completion stars
      const completionStars = calculateCompletionStars(
        puzzle.phrase,
        state.kidState.hintMeterUsed,
        state.kidState.starsThisRound
      );

      return {
        ...state,
        revealedPositions: newRevealed,
        turnState: 'ROUND_OVER',
        kidState: {
          ...state.kidState,
          stars: state.kidState.stars + state.kidState.starsThisRound + completionStars,
          starsThisRound: state.kidState.starsThisRound + completionStars
        }
      };
    }

    case 'KID_RESET_GAME': {
      return {
        ...INITIAL_KID_GAME_STATE,
        seed: Date.now()
      };
    }

    // ============================================
    // TREASURE BOX ACTIONS
    // ============================================

    case 'KID_BUY_ITEM': {
      const { itemId } = action;
      const item = getShopItem(itemId);

      if (!item) {
        return state; // Item doesn't exist
      }

      // Check if already owned
      if (state.kidState.treasure.ownedItems.includes(itemId)) {
        return state;
      }

      // Calculate current balance
      const totalStars = state.kidState.stars + state.kidState.starsThisRound;
      const totalCash = totalStars * CASH_PER_STAR;
      const balance = totalCash - state.kidState.treasure.kidBankSpent;

      // Check if can afford
      if (balance < item.price) {
        return state;
      }

      return {
        ...state,
        kidState: {
          ...state.kidState,
          treasure: {
            ...state.kidState.treasure,
            ownedItems: [...state.kidState.treasure.ownedItems, itemId],
            kidBankSpent: state.kidState.treasure.kidBankSpent + item.price
          }
        }
      };
    }

    case 'KID_EQUIP_ITEM': {
      const { itemId, category } = action;

      // Check if owned
      if (!state.kidState.treasure.ownedItems.includes(itemId)) {
        return state;
      }

      const newTreasure = { ...state.kidState.treasure };

      switch (category) {
        case 'wheel_theme':
          newTreasure.equippedWheelTheme = itemId;
          break;
        case 'vanna_dress':
          newTreasure.equippedDressColor = itemId;
          break;
        case 'vanna_hair':
          newTreasure.equippedHairColor = itemId;
          break;
        // Instruments don't need equipping
        default:
          return state;
      }

      return {
        ...state,
        kidState: {
          ...state.kidState,
          treasure: newTreasure
        }
      };
    }

    case 'KID_UNEQUIP_ITEM': {
      const { category } = action;
      const newTreasure = { ...state.kidState.treasure };

      switch (category) {
        case 'wheel_theme':
          newTreasure.equippedWheelTheme = null;
          break;
        case 'vanna_dress':
          newTreasure.equippedDressColor = null;
          break;
        case 'vanna_hair':
          newTreasure.equippedHairColor = null;
          break;
        default:
          return state;
      }

      return {
        ...state,
        kidState: {
          ...state.kidState,
          treasure: newTreasure
        }
      };
    }

    case 'KID_CLAIM_ACHIEVEMENT': {
      const { achievementId, rewardItemIds } = action;

      // Check if already claimed
      if (state.kidState.treasure.unlockedAchievements.includes(achievementId)) {
        return state;
      }

      // Add achievement and reward items (without spending money)
      const newOwnedItems = [...state.kidState.treasure.ownedItems];
      for (const itemId of rewardItemIds) {
        if (!newOwnedItems.includes(itemId)) {
          newOwnedItems.push(itemId);
        }
      }

      return {
        ...state,
        kidState: {
          ...state.kidState,
          treasure: {
            ...state.kidState.treasure,
            ownedItems: newOwnedItems,
            unlockedAchievements: [
              ...state.kidState.treasure.unlockedAchievements,
              achievementId
            ]
          }
        }
      };
    }

    case 'KID_HYDRATE_STATE': {
      // Restore state from storage with deep merge
      const restored = action.state;
      return {
        ...state,
        ...restored,
        kidState: {
          ...state.kidState,
          ...(restored.kidState || {}),
          treasure: {
            ...state.kidState.treasure,
            ...(restored.kidState?.treasure || {})
          }
        }
      };
    }

    default:
      return state;
  }
}

/**
 * Helper to check if player should see a hint nudge
 */
export function shouldShowHintNudge(state: KidGameState, threshold: number = 3): boolean {
  return (
    state.kidState.actionsWithoutProgress >= threshold &&
    state.kidState.hintMeterUsed < HINT_METER_MAX
  );
}

/**
 * Get current hint type available
 */
export function getCurrentHintType(state: KidGameState): HintType | null {
  if (state.kidState.hintMeterUsed >= HINT_METER_MAX) {
    return null;
  }
  return HINT_SEQUENCE[state.kidState.hintMeterUsed];
}

/**
 * Get hint description for UI
 */
export function getHintDescription(hintType: HintType): string {
  switch (hintType) {
    case 'REVEAL_CONSONANT':
      return 'Show a consonant';
    case 'REVEAL_VOWEL':
      return 'Show a vowel';
    case 'REVEAL_FIRST_LETTERS':
      return 'Show first letters';
    case 'REVEAL_WORD':
      return 'Show a word';
    default:
      return 'Get a hint';
  }
}

/**
 * Get Kid Bank balance (total earned minus spent)
 */
export function getKidBankBalance(state: KidGameState): number {
  const totalStars = state.kidState.stars + state.kidState.starsThisRound;
  const totalCash = totalStars * CASH_PER_STAR;
  return totalCash - state.kidState.treasure.kidBankSpent;
}

/**
 * Check if player can afford an item
 */
export function canAffordItem(state: KidGameState, price: number): boolean {
  return getKidBankBalance(state) >= price;
}

/**
 * Check for newly unlocked achievements
 */
export function checkForNewAchievements(state: KidGameState) {
  const totalStars = state.kidState.stars + state.kidState.starsThisRound;
  return getNewAchievements(totalStars, state.kidState.treasure.unlockedAchievements);
}
