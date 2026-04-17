import { GameState, Puzzle, VOWELS, WheelWedge } from './types';
import { SeededRNG } from './rng';

export const INITIAL_STATE: GameState = {
  currentPuzzle: null,
  guessedLetters: [],
  revealedPositions: [],
  spinResult: null,
  turnState: 'IDLE',
  player: { currentRoundScore: 0, totalScore: 0, freePlay: false },
  tossUpRevealOrder: [],
  tossUpIndex: 0,
  bonusTimer: 10,
  bonusPicks: [],
  packId: 'default',
  seed: Date.now(),
  roundCount: 0,
  spinCount: 0
};

export type GameAction = 
  | { type: 'START_ROUND'; puzzle: Puzzle; seed?: number }
  | { type: 'SPIN_WHEEL' }
  | { type: 'SPIN_RESULT'; wedge: WheelWedge }
  | { type: 'GUESS_LETTER'; letter: string; cost: number }
  | { type: 'BUY_VOWEL' }
  | { type: 'SOLVE_ATTEMPT'; phrase: string }
  | { type: 'TOSS_UP_TICK' }
  | { type: 'ADD_TO_ROUND_SCORE'; points: number }
  | { type: 'CLEAR_ROUND_SCORE' }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Use a temporary RNG instance based on current state seed + roundCount to keep deterministic flow if needed
  // ideally the RNG would be passed in or part of state, but for reducer purity we usually pass seeds
  
  switch (action.type) {
    case 'START_ROUND': {
      const { puzzle, seed } = action;
      // Setup reveal order for tossups or just all hidden for main
      const positions = Array.from({ length: puzzle.phrase.length }, (_, i) => i);
      const letterPositions = positions.filter(i => /[A-Z]/.test(puzzle.phrase[i]));
      
      const rng = new SeededRNG(seed || state.seed + state.roundCount);
      const shuffledReveal = rng.shuffle(letterPositions);

      // For Bonus rounds, reveal RSTLNE immediately
      let revealed = [] as number[];
      if (puzzle.round_type === 'BONUS') {
        const RSTLNE = ['R','S','T','L','N','E'];
        for (let i = 0; i < puzzle.phrase.length; i++) {
          if (RSTLNE.includes(puzzle.phrase[i].toUpperCase())) {
            revealed.push(i);
          }
        }
      }

      return {
        ...state,
        currentPuzzle: puzzle,
        guessedLetters: puzzle.round_type === 'BONUS' ? ['R','S','T','L','N','E'] : [],
        revealedPositions: revealed, 
        spinResult: null,
        turnState: puzzle.round_type === 'TOSSUP' ? 'IDLE' : 'IDLE',
        tossUpRevealOrder: shuffledReveal,
        tossUpIndex: 0,
        player: { ...state.player, currentRoundScore: 0, freePlay: false },
        roundCount: state.roundCount + 1,
        spinCount: 0
      };
    }

    case 'SPIN_WHEEL':
      return { ...state, turnState: 'SPINNING', spinCount: state.spinCount + 1 };

    case 'SPIN_RESULT': {
      const { wedge } = action;
      if (wedge.type === 'BANKRUPT') {
        return {
          ...state,
          spinResult: 'BANKRUPT',
          player: { ...state.player, currentRoundScore: 0 },
          turnState: 'IDLE' // End turn effectively, logic handled by UI to show toast then allow next action
        };
      }
      if (wedge.type === 'LOSE_TURN') {
         return {
          ...state,
          spinResult: 'LOSE_TURN',
          turnState: 'IDLE'
        };
      }
      return {
        ...state,
        spinResult: wedge.value,
        turnState: 'GUESSING_CONSONANT',
        player: { ...state.player, freePlay: wedge.type === 'FREE_PLAY' }
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

      // Add money if consonant and not buying
      if (!isVowel && typeof state.spinResult === 'number' && !state.player.freePlay) {
        newScore += (state.spinResult * count);
      }
      
      // Determine next turn state
      let nextTurnState: typeof state.turnState = state.turnState;
      
      // After any letter guess (consonant or vowel), return to IDLE to allow choosing next action
      // (spin again, buy vowel, solve, or guess another consonant)
      // On wrong guess and not free play, turn ends; UI handles flow
      nextTurnState = 'IDLE';
      
      return {
        ...state,
        guessedLetters: [...state.guessedLetters, upper],
        revealedPositions: newRevealed,
        player: { ...state.player, currentRoundScore: newScore },
        turnState: nextTurnState,
        // Keep spinResult so player can continue guessing/buying without re-spinning
        spinResult: state.spinResult
      };
    }

    case 'TOSS_UP_TICK': {
      if (state.tossUpIndex >= state.tossUpRevealOrder.length) return state;
      const nextPos = state.tossUpRevealOrder[state.tossUpIndex];
      return {
        ...state,
        revealedPositions: [...state.revealedPositions, nextPos],
        tossUpIndex: state.tossUpIndex + 1
      };
    }

    case 'SOLVE_ATTEMPT': {
      const correct = action.phrase.toUpperCase() === state.currentPuzzle?.phrase.toUpperCase();
      if (correct) {
        return {
          ...state,
          turnState: 'ROUND_OVER',
          revealedPositions: Array.from({ length: state.currentPuzzle!.phrase.length }, (_, i) => i), // Reveal all
          player: {
             ...state.player,
             totalScore: state.player.totalScore + state.player.currentRoundScore
          }
        };
      }
      return state; // Wrong solve, logic handled by UI (lose turn)
    }
    
    case 'ADD_TO_ROUND_SCORE': {
      const { points } = action;
      return {
        ...state,
        player: { ...state.player, currentRoundScore: state.player.currentRoundScore + points }
      };
    }

    case 'CLEAR_ROUND_SCORE': {
      return {
        ...state,
        player: { ...state.player, currentRoundScore: 0 }
      };
    }

    case 'BUY_VOWEL': {
      return {
        ...state,
        turnState: 'BUYING_VOWEL'
      };
    }

    case 'RESET_GAME':
      return { ...INITIAL_STATE, seed: Date.now() };

    default:
      return state;
  }
}
