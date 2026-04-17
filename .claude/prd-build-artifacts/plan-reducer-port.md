# Plan: reducer-port

## Ordered action list (simplest → most complex)

1. **RESET_ROUND** — trivial state reset.
2. **SELECT_PUZZLE** — set puzzle and reset per-round.
3. **RANDOM_PUZZLE** — pick from list, reset per-round.
4. **BUZZ_IN** — turnState transition.
5. **CANCEL_TOSS_UP_ATTEMPT** — turnState transition.
6. **BONUS_TICK** — decrement timer, transition on expiry.
7. **BONUS_SOLVE_ATTEMPT** — compare phrase, win or no-op.
8. **TOSS_UP_SOLVE_ATTEMPT** — win or lockout transition.
9. **BONUS_CHOOSE_LETTERS** — validation-heavy, reveal logic.
10. **TOSS_UP_TICK (payload)** — complex: handles lockout countdown, reveal cadence, round-over.
11. Update **SPIN_RESULT** mustSpin side-effects.
12. Update **GUESS_LETTER** mustSpin side-effects (wrong clears spinResult + mustSpin=true; correct keeps + mustSpin=false).
13. Update **BUY_VOWEL** to reject when mustSpin===true.
14. Update **START_ROUND** to set TOSSUP_REVEALING / BONUS_PICKING turnStates and initialize new fields.

## Fields to add to GameState

- `mustSpin: boolean` (initial: false — iOS snapshot has false; acceptance criterion says "initial: true" but iOS sets false initially and START_ROUND resets false. Acceptance criteria conflict with iOS snapshot. Follow iOS behavior as the authoritative source — that's what the tests assert implicitly).

Actually re-reading AC4: "mustSpin boolean exists on GameState (initial: true)". iOS has false. The iOS test suite doesn't directly test `INITIAL_STATE.mustSpin`. To satisfy both, I'll set `INITIAL_STATE.mustSpin = true` to satisfy AC literally, then verify START_ROUND resets it to false (which matches iOS behavior, and this is what the tests exercise).

- `tossUpElapsedMs: number` (initial: 0)
- `tossUpRevealIntervalMs: number` (initial: 1000)
- `tossUpLockoutMs: number` (initial: 0)
- `tossUpLockoutDurationMs: number` (initial: 3000)
- `bonusTimerMs: number` (initial: 20000)
- `bonusTimerDurationMs: number` (initial: 20000)
- `roundResult: 'win' | 'loss' | null` (initial: null)

Existing fields remain: `bonusTimer` (unused by new logic but kept for back-compat), `bonusPicks`, `tossUpIndex`, `tossUpRevealOrder`.

## Import path adaptations for ported tests

iOS tests use `from '../engine/game'` because they sit in `/ios/src/__tests__/`. In app, tests will go to `/app/src/engine/__tests__/` so imports must be `from '../game'`, `from '../types'`, `from '../rng'`, `from '../packs'`, `from '../wheelSpin'`.

Adaptations:
- `../engine/game` → `../game`
- `../engine/types` → `../types`
- `../engine/rng` → `../rng`
- `../engine/packs` → `../packs`
- `../engine/wheelSpin` → `../wheelSpin`

## New files to create

- `app/src/engine/wheelSpin.ts` — copy iOS verbatim.
- `app/src/engine/__tests__/bonusEngine.test.ts`
- `app/src/engine/__tests__/tossUpEngine.test.ts`
- `app/src/engine/__tests__/tossUpCancel.test.ts`
- `app/src/engine/__tests__/wheelSpin.test.ts`
- `app/src/engine/__tests__/puzzleModes.test.ts`

## Files to modify

- `app/src/engine/types.ts` — extend GameState, turnState union.
- `app/src/engine/game.ts` — add 10 new action handlers, mustSpin side-effects, SOLVE_ATTEMPT use normalizePhraseForComparison (already parity-ish), update START_ROUND.
- `app/src/engine/__tests__/characterization.test.ts` — additive updates for new fields; update START_ROUND on TOSSUP/BONUS test to reflect new turnStates; update TOSS_UP_TICK test to pass `dtMs`; update GUESS_LETTER incorrect test (spinResult now cleared).
- `app/src/engine/__tests__/SNAPSHOT_LOCK.md` — append entry.

## Risk areas

- `game.test.ts` (existing) may be stale. Check it for breakage after refactor.
- `game-state-refactor.test.ts` (existing) tests mutations via partial state — verify no conflicts.
- `bankrupt-and-lose-turn.test.ts` — likely compatible because BANKRUPT/LOSE_TURN SPIN_RESULT preserves existing behavior with addition of `mustSpin=true`.
- `schema-migration.test.ts` — if the GameState shape is persisted somewhere, new fields may need defaults. Check this test.
