/**
 * Persistence schema for GameState.
 *
 * Protects returning users whose localStorage has pre-migration state that
 * would crash on hydrate after the reducer-port / free-play removal.
 *
 * Strategy:
 *  - Every persisted blob carries a `schemaVersion` field.
 *  - Hydration goes through `migrateState()` which validates with zod.
 *  - Legacy (unversioned, or pre-v2 containing removed fields like `freePlay`)
 *    blobs return `null` — callers fall back to INITIAL_STATE.
 *  - Corrupted JSON blobs also return `null`.
 *
 * The PRD is explicit that there is no in-place v1 -> v2 migration: reject
 * and re-initialize rather than carry forward potentially invalid shapes.
 */

import { z } from 'zod';
import type { GameState } from './types';

/** Bump this any time the persisted GameState shape changes. */
export const SCHEMA_VERSION = 2 as const;

// --- Inner piece schemas -----------------------------------------------------

const RoundTypeSchema = z.enum(['MAIN', 'TOSSUP', 'BONUS']);

const PuzzleDifficultySchema = z.object({
  score: z.number(),
  reasons: z.array(z.string()),
});

const PuzzleSchema = z.object({
  id: z.string(),
  phrase: z.string(),
  category: z.string(),
  round_type: RoundTypeSchema,
  difficulty: PuzzleDifficultySchema.optional(),
  season: z.number().optional(),
});

// PlayerState post-remove-free-play: NO freePlay field.
const PlayerStateSchema = z
  .object({
    currentRoundScore: z.number(),
    totalScore: z.number(),
  })
  .strict(); // strict => presence of freePlay (or any extra key) fails validation

const TurnStateSchema = z.enum([
  'IDLE',
  'SPINNING',
  'GUESSING_CONSONANT',
  'BUYING_VOWEL',
  'SOLVING',
  'ROUND_OVER',
]);

// SpinResult: 'BANKRUPT' | 'LOSE_TURN' | number | null — NO 'FREE_PLAY' allowed.
const SpinResultSchema = z.union([
  z.literal('BANKRUPT'),
  z.literal('LOSE_TURN'),
  z.number(),
  z.null(),
]);

/**
 * Zod schema for the current persisted GameState shape (SCHEMA_VERSION = 2).
 *
 * Note: wedge types are VALUE | BANKRUPT | LOSE_TURN (FREE_PLAY removed).
 * PlayerState has no `freePlay` field.
 */
export const GameStateSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  currentPuzzle: PuzzleSchema.nullable(),
  guessedLetters: z.array(z.string()),
  revealedPositions: z.array(z.number()),
  spinResult: SpinResultSchema,
  turnState: TurnStateSchema,
  player: PlayerStateSchema,
  tossUpRevealOrder: z.array(z.number()),
  tossUpIndex: z.number(),
  bonusTimer: z.number(),
  bonusPicks: z.array(z.string()),
  packId: z.string(),
  seed: z.number(),
  roundCount: z.number(),
  spinCount: z.number(),
});

export type PersistedGameState = z.infer<typeof GameStateSchema>;

/**
 * Attempt to validate a persisted blob against the current schema.
 *
 * Returns the parsed `GameState` (with `schemaVersion` stripped) on success,
 * or `null` on any failure (legacy shape, missing schemaVersion, corrupted
 * input, wrong type). Callers should fall back to `INITIAL_STATE` on `null`.
 *
 * The PRD specifies: no in-place migration from v1 (unversioned) to v2 — we
 * reject and let the caller reinitialize.
 */
export function migrateState(blob: unknown): GameState | null {
  if (blob == null || typeof blob !== 'object') {
    return null;
  }

  const parsed = GameStateSchema.safeParse(blob);
  if (!parsed.success) {
    return null;
  }

  // Strip schemaVersion — it's a persistence concern, not part of GameState.
  const { schemaVersion: _schemaVersion, ...rest } = parsed.data;
  return rest as GameState;
}

/**
 * Wrap a GameState with the current SCHEMA_VERSION for persistence.
 * Callers writing to localStorage should JSON.stringify the result of this.
 *
 * Return type is a `GameState & { schemaVersion }` rather than the inferred
 * `PersistedGameState` — the zod-inferred type narrows `spinResult` more
 * tightly than the GameState type, so we surface the runtime contract
 * (schemaVersion is added) without losing compatibility.
 */
export function withSchemaVersion(
  state: GameState,
): GameState & { schemaVersion: typeof SCHEMA_VERSION } {
  return { ...state, schemaVersion: SCHEMA_VERSION };
}
