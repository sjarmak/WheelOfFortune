import { GameState, Puzzle, VOWELS, CONSONANTS, WheelWedge } from './types';
import { SeededRNG } from './rng';

/**
 * Normalize a phrase for solve comparison: trim whitespace, collapse
 * multiple spaces, uppercase, and replace typographic quotes/apostrophes
 * with straight ASCII apostrophe so keyboard input matches puzzle data.
 */
export function normalizePhraseForComparison(phrase: string): string {
  return phrase
    .trim()
    .replace(/[\u2018\u2019\u2032\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export const INITIAL_STATE: GameState = {
  currentPuzzle: null,
  guessedLetters: [],
  revealedPositions: [],
  spinResult: null,
  turnState: 'IDLE',
  mustSpin: true,
  player: { currentRoundScore: 0, totalScore: 0 },
  tossUpRevealOrder: [],
  tossUpIndex: 0,
  tossUpElapsedMs: 0,
  tossUpRevealIntervalMs: 1000,
  tossUpLockoutMs: 0,
  tossUpLockoutDurationMs: 3000,
  bonusTimer: 10,
  bonusTimerMs: 20000,
  bonusTimerDurationMs: 20000,
  bonusPicks: [],
  roundResult: null,
  packId: 'default',
  seed: Date.now(),
  roundCount: 0,
  spinCount: 0,
};

export type GameAction =
  | { type: 'START_ROUND'; puzzle: Puzzle; seed?: number }
  | { type: 'SPIN_WHEEL' }
  | { type: 'SPIN_RESULT'; wedge: WheelWedge }
  | { type: 'GUESS_LETTER'; letter: string; cost: number }
  | { type: 'BUY_VOWEL' }
  | { type: 'SOLVE_ATTEMPT'; phrase: string }
  | { type: 'TOSS_UP_TICK'; dtMs: number }
  | { type: 'BUZZ_IN' }
  | { type: 'TOSS_UP_SOLVE_ATTEMPT'; phrase: string }
  | { type: 'CANCEL_TOSS_UP_ATTEMPT' }
  | { type: 'ADD_TO_ROUND_SCORE'; points: number }
  | { type: 'CLEAR_ROUND_SCORE' }
  | { type: 'RESET_GAME' }
  | { type: 'RESET_ROUND' }
  | { type: 'RANDOM_PUZZLE'; puzzles: Puzzle[] }
  | { type: 'SELECT_PUZZLE'; puzzle: Puzzle }
  | {
      type: 'BONUS_CHOOSE_LETTERS';
      consonants: [string, string, string];
      vowel: string;
    }
  | { type: 'BONUS_TICK'; dtMs: number }
  | { type: 'BONUS_SOLVE_ATTEMPT'; phrase: string };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_ROUND': {
      const { puzzle, seed } = action;
      const positions = Array.from({ length: puzzle.phrase.length }, (_, i) => i);
      const letterPositions = positions.filter((i) => /[A-Z]/.test(puzzle.phrase[i]));

      const rng = new SeededRNG(seed || state.seed + state.roundCount);
      const shuffledReveal = rng.shuffle(letterPositions);

      // For Bonus rounds, reveal RSTLNE immediately
      const revealed: number[] = [];
      if (puzzle.round_type === 'BONUS') {
        const RSTLNE = ['R', 'S', 'T', 'L', 'N', 'E'];
        for (let i = 0; i < puzzle.phrase.length; i++) {
          if (RSTLNE.includes(puzzle.phrase[i].toUpperCase())) {
            revealed.push(i);
          }
        }
      }

      const turnStateForMode =
        puzzle.round_type === 'TOSSUP'
          ? 'TOSSUP_REVEALING'
          : puzzle.round_type === 'BONUS'
            ? 'BONUS_PICKING'
            : 'IDLE';

      return {
        ...state,
        currentPuzzle: puzzle,
        guessedLetters:
          puzzle.round_type === 'BONUS' ? ['R', 'S', 'T', 'L', 'N', 'E'] : [],
        revealedPositions: revealed,
        spinResult: null,
        turnState: turnStateForMode,
        mustSpin: false,
        tossUpRevealOrder: shuffledReveal,
        tossUpIndex: 0,
        tossUpElapsedMs: 0,
        tossUpLockoutMs: 0,
        bonusTimerMs: state.bonusTimerDurationMs,
        bonusPicks: [],
        roundResult: null,
        player: { ...state.player, currentRoundScore: 0 },
        roundCount: state.roundCount + 1,
        spinCount: 0,
      };
    }

    case 'SPIN_WHEEL':
      return {
        ...state,
        turnState: 'SPINNING',
        spinCount: state.spinCount + 1,
      };

    case 'SPIN_RESULT': {
      const { wedge } = action;
      if (wedge.type === 'BANKRUPT') {
        return {
          ...state,
          spinResult: 'BANKRUPT',
          mustSpin: true,
          player: { ...state.player, currentRoundScore: 0 },
          turnState: 'IDLE',
        };
      }
      if (wedge.type === 'LOSE_TURN') {
        return {
          ...state,
          spinResult: 'LOSE_TURN',
          mustSpin: true,
          turnState: 'IDLE',
        };
      }
      return {
        ...state,
        spinResult: wedge.value,
        mustSpin: false,
        turnState: 'GUESSING_CONSONANT',
      };
    }

    case 'GUESS_LETTER': {
      const { letter, cost } = action;
      const puzzle = state.currentPuzzle!;
      const upper = letter.toUpperCase();

      // Prevent guessing same letter twice
      if (state.guessedLetters.includes(upper)) {
        return state;
      }

      const isVowel = VOWELS.includes(upper);

      // Deduct cost (buying vowel)
      let newScore = state.player.currentRoundScore - cost;

      // Logic for occurrences
      let count = 0;
      const newRevealed = [...state.revealedPositions];

      for (let i = 0; i < puzzle.phrase.length; i++) {
        if (puzzle.phrase[i].toUpperCase() === upper) {
          count++;
          if (!newRevealed.includes(i)) newRevealed.push(i);
        }
      }

      // Add money if consonant
      if (!isVowel && typeof state.spinResult === 'number') {
        newScore += state.spinResult * count;
      }

      // Preserve spinResult so UI can continue the turn; set mustSpin based
      // on correctness (wrong guess forces a new spin before buying vowels).
      const isCorrect = count > 0;

      return {
        ...state,
        guessedLetters: [...state.guessedLetters, upper],
        revealedPositions: newRevealed,
        player: { ...state.player, currentRoundScore: newScore },
        turnState: 'IDLE',
        spinResult: state.spinResult,
        mustSpin: !isCorrect,
      };
    }

    case 'TOSS_UP_TICK': {
      const { dtMs } = action;

      if (
        state.turnState !== 'TOSSUP_REVEALING' &&
        state.turnState !== 'TOSSUP_LOCKED_OUT'
      ) {
        return state;
      }

      // Handle lockout countdown
      if (state.turnState === 'TOSSUP_LOCKED_OUT') {
        const remainingLockout = state.tossUpLockoutMs - dtMs;
        if (remainingLockout > 0) {
          return {
            ...state,
            tossUpLockoutMs: remainingLockout,
          };
        }
        // Lockout expired — resume revealing with leftover time
        const leftoverMs = -remainingLockout;
        return gameReducer(
          {
            ...state,
            turnState: 'TOSSUP_REVEALING',
            tossUpLockoutMs: 0,
          },
          { type: 'TOSS_UP_TICK', dtMs: leftoverMs },
        );
      }

      // TOSSUP_REVEALING: accumulate elapsed time and reveal letters
      let elapsed = state.tossUpElapsedMs + dtMs;
      let index = state.tossUpIndex;
      const newRevealed = [...state.revealedPositions];

      while (
        elapsed >= state.tossUpRevealIntervalMs &&
        index < state.tossUpRevealOrder.length
      ) {
        newRevealed.push(state.tossUpRevealOrder[index]);
        index++;
        elapsed -= state.tossUpRevealIntervalMs;
      }

      // All letters revealed — round over as loss
      if (index >= state.tossUpRevealOrder.length) {
        const allPositions = Array.from(
          { length: state.currentPuzzle!.phrase.length },
          (_, i) => i,
        );
        return {
          ...state,
          revealedPositions: allPositions,
          tossUpIndex: state.tossUpRevealOrder.length,
          tossUpElapsedMs: 0,
          turnState: 'ROUND_OVER',
          roundResult: 'loss',
        };
      }

      return {
        ...state,
        revealedPositions: newRevealed,
        tossUpIndex: index,
        tossUpElapsedMs: elapsed,
      };
    }

    case 'BUZZ_IN': {
      if (state.turnState !== 'TOSSUP_REVEALING') {
        return state;
      }
      return {
        ...state,
        turnState: 'TOSSUP_BUZZED',
      };
    }

    case 'TOSS_UP_SOLVE_ATTEMPT': {
      if (state.turnState !== 'TOSSUP_BUZZED') {
        return state;
      }
      const correct =
        normalizePhraseForComparison(action.phrase) ===
        normalizePhraseForComparison(state.currentPuzzle?.phrase ?? '');
      if (correct) {
        const allPositions = Array.from(
          { length: state.currentPuzzle!.phrase.length },
          (_, i) => i,
        );
        return {
          ...state,
          turnState: 'ROUND_OVER',
          roundResult: 'win',
          revealedPositions: allPositions,
        };
      }
      return {
        ...state,
        turnState: 'TOSSUP_LOCKED_OUT',
        tossUpLockoutMs: state.tossUpLockoutDurationMs,
      };
    }

    case 'CANCEL_TOSS_UP_ATTEMPT': {
      if (state.turnState !== 'TOSSUP_BUZZED') {
        return state;
      }
      return {
        ...state,
        turnState: 'TOSSUP_REVEALING',
      };
    }

    case 'BONUS_CHOOSE_LETTERS': {
      if (state.turnState !== 'BONUS_PICKING') {
        return state;
      }

      const { consonants, vowel } = action;
      const RSTLNE = ['R', 'S', 'T', 'L', 'N', 'E'];

      // Validate exactly 3 consonants
      if (consonants.length !== 3) {
        return state;
      }

      // Validate all consonants are valid and distinct
      const upperConsonants = consonants.map((c) => c.toUpperCase());
      const uniqueConsonants = new Set(upperConsonants);
      if (uniqueConsonants.size !== 3) {
        return state;
      }
      for (const c of upperConsonants) {
        if (!CONSONANTS.includes(c)) {
          return state;
        }
        if (RSTLNE.includes(c)) {
          return state;
        }
      }

      // Validate vowel
      const upperVowel = vowel.toUpperCase();
      if (!VOWELS.includes(upperVowel)) {
        return state;
      }
      if (RSTLNE.includes(upperVowel)) {
        return state;
      }

      // All valid — reveal positions for chosen letters
      const chosenLetters = [...upperConsonants, upperVowel];
      const newGuessed = [...state.guessedLetters, ...chosenLetters];
      const newRevealed = [...state.revealedPositions];
      const phrase = state.currentPuzzle!.phrase;

      for (let i = 0; i < phrase.length; i++) {
        if (
          chosenLetters.includes(phrase[i].toUpperCase()) &&
          !newRevealed.includes(i)
        ) {
          newRevealed.push(i);
        }
      }

      return {
        ...state,
        guessedLetters: newGuessed,
        revealedPositions: newRevealed,
        bonusPicks: chosenLetters,
        turnState: 'BONUS_SOLVE_TIMER',
      };
    }

    case 'BONUS_TICK': {
      if (state.turnState !== 'BONUS_SOLVE_TIMER') {
        return state;
      }
      const remaining = state.bonusTimerMs - action.dtMs;
      if (remaining <= 0) {
        const allPositions = Array.from(
          { length: state.currentPuzzle!.phrase.length },
          (_, i) => i,
        );
        return {
          ...state,
          bonusTimerMs: 0,
          turnState: 'ROUND_OVER',
          roundResult: 'loss',
          revealedPositions: allPositions,
        };
      }
      return {
        ...state,
        bonusTimerMs: remaining,
      };
    }

    case 'BONUS_SOLVE_ATTEMPT': {
      if (state.turnState !== 'BONUS_SOLVE_TIMER') {
        return state;
      }
      const correct =
        normalizePhraseForComparison(action.phrase) ===
        normalizePhraseForComparison(state.currentPuzzle?.phrase ?? '');
      if (correct) {
        const allPositions = Array.from(
          { length: state.currentPuzzle!.phrase.length },
          (_, i) => i,
        );
        return {
          ...state,
          turnState: 'ROUND_OVER',
          roundResult: 'win',
          revealedPositions: allPositions,
        };
      }
      return state;
    }

    case 'SOLVE_ATTEMPT': {
      const correct =
        normalizePhraseForComparison(action.phrase) ===
        normalizePhraseForComparison(state.currentPuzzle?.phrase ?? '');
      if (correct) {
        return {
          ...state,
          turnState: 'ROUND_OVER',
          revealedPositions: Array.from(
            { length: state.currentPuzzle!.phrase.length },
            (_, i) => i,
          ),
          player: {
            ...state.player,
            totalScore:
              state.player.totalScore + state.player.currentRoundScore,
          },
        };
      }
      return state; // Wrong solve, logic handled by UI (lose turn)
    }

    case 'ADD_TO_ROUND_SCORE': {
      const { points } = action;
      return {
        ...state,
        player: {
          ...state.player,
          currentRoundScore: state.player.currentRoundScore + points,
        },
      };
    }

    case 'CLEAR_ROUND_SCORE': {
      return {
        ...state,
        player: { ...state.player, currentRoundScore: 0 },
      };
    }

    case 'BUY_VOWEL': {
      // Reject vowel purchase when player must spin first (after wrong guess,
      // BANKRUPT, or LOSE_TURN).
      if (state.mustSpin) {
        return state;
      }
      return {
        ...state,
        turnState: 'BUYING_VOWEL',
      };
    }

    case 'RESET_ROUND': {
      return {
        ...state,
        guessedLetters: [],
        revealedPositions: [],
        spinResult: null,
        turnState: 'IDLE',
        mustSpin: false,
        player: { ...state.player, currentRoundScore: 0 },
      };
    }

    case 'RANDOM_PUZZLE': {
      const { puzzles } = action;
      const available = puzzles.filter((p) => p.id !== state.currentPuzzle?.id);
      if (available.length === 0) return state;
      const randomIndex = Math.floor(Math.random() * available.length);
      const selected = available[randomIndex];
      return {
        ...state,
        currentPuzzle: selected,
        guessedLetters: [],
        revealedPositions: [],
        spinResult: null,
        turnState: 'IDLE',
        mustSpin: false,
        player: { ...state.player, currentRoundScore: 0 },
      };
    }

    case 'SELECT_PUZZLE': {
      const { puzzle } = action;
      return {
        ...state,
        currentPuzzle: puzzle,
        guessedLetters: [],
        revealedPositions: [],
        spinResult: null,
        turnState: 'IDLE',
        mustSpin: false,
        player: { ...state.player, currentRoundScore: 0 },
      };
    }

    case 'RESET_GAME':
      return { ...INITIAL_STATE, seed: Date.now() };

    default:
      return state;
  }
}
