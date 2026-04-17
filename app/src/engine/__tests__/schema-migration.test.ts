/**
 * Tests for persistence schema migration.
 *
 * Protects returning users whose localStorage has pre-migration state that
 * would crash on hydrate after the reducer-port / free-play removal.
 *
 * Acceptance criteria (from PRD):
 *   (a) valid new-schema blob with schemaVersion=2 parses successfully
 *   (b) legacy/unversioned blob (no schemaVersion, has removed 'freePlay')
 *       returns null — caller falls back to INITIAL_STATE
 *   (c) corrupted JSON string returns null
 */

import { describe, test, expect } from 'vitest';
import { migrateState, withSchemaVersion, SCHEMA_VERSION, GameStateSchema } from '../schema';
import { INITIAL_STATE } from '../game';
import type { GameState } from '../types';

function makeValidState(): GameState {
  // Start from INITIAL_STATE and add a currentPuzzle so we exercise the
  // nested-object path of the schema too.
  return {
    ...INITIAL_STATE,
    currentPuzzle: {
      id: 'test-1',
      phrase: 'HELLO WORLD',
      category: 'PHRASE',
      round_type: 'MAIN',
    },
    guessedLetters: ['H', 'E'],
    revealedPositions: [0, 1],
    spinResult: 500,
    turnState: 'GUESSING_CONSONANT',
    player: { currentRoundScore: 500, totalScore: 1500 },
    seed: 12345,
    roundCount: 2,
    spinCount: 3,
  };
}

describe('schema-migration', () => {
  describe('SCHEMA_VERSION', () => {
    test('is 2', () => {
      expect(SCHEMA_VERSION).toBe(2);
    });
  });

  describe('migrateState — valid v2 blob', () => {
    test('(a) valid new-schema blob with schemaVersion=2 parses successfully', () => {
      const state = makeValidState();
      const persisted = withSchemaVersion(state);

      // Simulate JSON round-trip through localStorage.
      const roundTripped = JSON.parse(JSON.stringify(persisted));
      const result = migrateState(roundTripped);

      expect(result).not.toBeNull();
      expect(result?.currentPuzzle?.phrase).toBe('HELLO WORLD');
      expect(result?.player.currentRoundScore).toBe(500);
      expect(result?.player.totalScore).toBe(1500);
      expect(result?.guessedLetters).toEqual(['H', 'E']);
      expect(result?.revealedPositions).toEqual([0, 1]);
      expect(result?.turnState).toBe('GUESSING_CONSONANT');
      expect(result?.seed).toBe(12345);
      expect(result?.roundCount).toBe(2);
      expect(result?.spinCount).toBe(3);

      // schemaVersion should NOT leak into the returned GameState (it's a
      // persistence-layer concern, not part of the reducer's state shape).
      expect((result as unknown as { schemaVersion?: number }).schemaVersion).toBeUndefined();
    });

    test('INITIAL_STATE round-trips through withSchemaVersion + migrateState', () => {
      const persisted = withSchemaVersion(INITIAL_STATE);
      const roundTripped = JSON.parse(JSON.stringify(persisted));
      const result = migrateState(roundTripped);

      expect(result).not.toBeNull();
      expect(result?.currentPuzzle).toBeNull();
      expect(result?.guessedLetters).toEqual([]);
      expect(result?.turnState).toBe('IDLE');
    });
  });

  describe('migrateState — legacy / invalid blobs', () => {
    test('(b) legacy/unversioned blob with removed freePlay field returns null', () => {
      // This is what a pre-migration localStorage blob looks like: no
      // schemaVersion, and PlayerState still has the removed `freePlay` field.
      const legacy = {
        currentPuzzle: null,
        guessedLetters: [],
        revealedPositions: [],
        spinResult: null,
        turnState: 'IDLE',
        player: {
          currentRoundScore: 0,
          totalScore: 0,
          freePlay: true, // <-- REMOVED field — must cause rejection
        },
        tossUpRevealOrder: [],
        tossUpIndex: 0,
        bonusTimer: 10,
        bonusPicks: [],
        packId: 'default',
        seed: 1,
        roundCount: 0,
        spinCount: 0,
        // NOTE: no schemaVersion
      };

      const result = migrateState(legacy);
      expect(result).toBeNull();
    });

    test('unversioned blob without freePlay also returns null (missing schemaVersion)', () => {
      // Even a structurally-correct but unversioned blob is rejected —
      // PRD says migrateState returns null on legacy; no in-place migration.
      const unversioned = {
        ...INITIAL_STATE,
      };
      const result = migrateState(unversioned);
      expect(result).toBeNull();
    });

    test('blob with wrong schemaVersion (e.g., 1 or 3) returns null', () => {
      const wrongVersion = {
        ...INITIAL_STATE,
        schemaVersion: 1,
      };
      expect(migrateState(wrongVersion)).toBeNull();

      const futureVersion = {
        ...INITIAL_STATE,
        schemaVersion: 99,
      };
      expect(migrateState(futureVersion)).toBeNull();
    });

    test('(c) corrupted JSON string returns null', () => {
      // Simulates the hydration path: JSON.parse() of a corrupted blob may
      // throw, or may return a non-object. migrateState must handle both
      // by returning null (caller wraps in try/catch for the throw case).
      let parsed: unknown = undefined;
      try {
        parsed = JSON.parse('{not valid json');
      } catch {
        // JSON.parse throws — the App.tsx try/catch handles this. Simulate
        // the fallback value migrateState would receive after such a catch.
        parsed = undefined;
      }
      expect(migrateState(parsed)).toBeNull();

      // Also exercise the non-throwing corruption cases directly:
      expect(migrateState(null)).toBeNull();
      expect(migrateState(undefined)).toBeNull();
      expect(migrateState('not an object')).toBeNull();
      expect(migrateState(42)).toBeNull();
      expect(migrateState(['array', 'not', 'object'])).toBeNull();
      expect(migrateState({})).toBeNull(); // empty object — missing all fields
    });
  });

  describe('withSchemaVersion', () => {
    test('adds schemaVersion=2 to the state', () => {
      const persisted = withSchemaVersion(INITIAL_STATE);
      expect(persisted.schemaVersion).toBe(2);
    });

    test('produces a blob that passes GameStateSchema validation', () => {
      const persisted = withSchemaVersion(makeValidState());
      const parsed = GameStateSchema.safeParse(persisted);
      expect(parsed.success).toBe(true);
    });
  });
});
