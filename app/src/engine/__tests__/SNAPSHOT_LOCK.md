# Characterization Snapshot Lock

This document pins the **current** behavior of the web game reducer
(`app/src/engine/game.ts`) captured by
`app/src/engine/__tests__/characterization.test.ts`.

## Reducer SHA at time of capture

- **File:** `app/src/engine/game.ts`
- **Commit SHA:** `b9c4cc8a4550d6ece417a2312d7bc7f69378936c`
- **Captured on branch:** `ralph/tossup-bonus-modes`
- **Reducer version note:** Pre-refactor baseline. Covers `GameAction` union of
  `START_ROUND | SPIN_WHEEL | SPIN_RESULT | GUESS_LETTER | BUY_VOWEL |
  SOLVE_ATTEMPT | TOSS_UP_TICK | ADD_TO_ROUND_SCORE | CLEAR_ROUND_SCORE |
  RESET_GAME`. Wedge union: `CASH | BANKRUPT | LOSE_TURN | FREE_PLAY | PRIZE`.
  `kidGame.ts` does **not** define `KID_HYDRATE_STATE` at this SHA, so the
  corresponding test block is `describe.skip`'d.

To re-capture the SHA:

```bash
git log -1 --format=%H -- app/src/engine/game.ts
```

## Rules for updating the snapshot

1. **Do not "fix" a failing characterization test by changing assertions** to
   match new reducer behavior without an explicit, justified reason. The whole
   point of these tests is to catch silent behavior drift.
2. **If a characterization test fails because the reducer intentionally
   changed**, the update must:
   - Link a PR or issue describing the intended behavior change.
   - Update this file's `Reducer SHA at time of capture` to the new commit
     touching `game.ts`.
   - Add an entry to the "Change log" section below describing what was
     re-snapshotted and why.
3. **Do not commit unexplained snapshot updates.** Any diff to
   `characterization.test.ts` must include an investigation comment (inline or
   in the PR description) pointing to the tracking issue.
4. **Do not modify `game.ts` or `types.ts` in the same commit that updates
   these tests** — separate "behavior change" from "snapshot re-capture" so
   each is reviewable on its own.

## Assertion style used

The characterization suite uses **explicit assertions** from Vitest
(`.toBe`, `.toEqual`, `.toContain`) rather than inline/file snapshots
(`.toMatchSnapshot()` / `.toMatchInlineSnapshot()`). Rationale:

- Explicit assertions document the *why* of each expectation, not just the
  *what*.
- Reviewers can reason about a single value at a time, not a blob.
- There is no snapshot file to accidentally "update" without thought.

When asserting whole-state shape (e.g. `INITIAL_STATE`), we use `.toEqual`
against a hand-written object literal and normalize non-deterministic fields
(like `seed: Date.now()`) before comparison.

## Change log

- `2026-04-17` — Initial capture at reducer SHA
  `b9c4cc8a4550d6ece417a2312d7bc7f69378936c`. 19 test cases across the
  `GameAction` union, wedge-type branches, and wedge-type snapshot. One
  intentionally-skipped `describe` block for the absent `KID_HYDRATE_STATE`
  action.
- `2026-04-17` — Re-snapshot after `remove-free-play` unit (PRD
  `history/prd_ios_to_web_migration.md`, R4 + final commit sequence item 3).
  Wedge union is now `VALUE | BANKRUPT | LOSE_TURN` to match iOS (`CASH`
  renamed to `VALUE`, `FREE_PLAY` and `PRIZE` removed). `PlayerState` no
  longer carries `freePlay`. Removed the `SPIN_RESULT on FREE_PLAY wedge`
  test entirely (wedge type no longer exists). Updated wedge-union snapshot
  test to assert the new 3-type union. This is an intentional, documented
  behavior change — the PRD mandates iOS parity.
- `2026-04-17` — Additive re-snapshot after `reducer-port` unit. The reducer
  now ports iOS behavior for toss-up and bonus rounds plus `mustSpin`
  semantics. Changes are **additive** to existing actions:
  - `INITIAL_STATE` shape gains `mustSpin: true`, `tossUpElapsedMs: 0`,
    `tossUpRevealIntervalMs: 1000`, `tossUpLockoutMs: 0`,
    `tossUpLockoutDurationMs: 3000`, `bonusTimerMs: 20000`,
    `bonusTimerDurationMs: 20000`, `roundResult: null`. The snapshot test
    was updated to assert the new fields.
  - `START_ROUND` on TOSSUP puzzles now enters `TOSSUP_REVEALING` (was
    `IDLE`). On BONUS puzzles now enters `BONUS_PICKING` (was `IDLE`). The
    existing `START_ROUND on TOSSUP` test was updated to assert the new
    turnState, and a new `START_ROUND on BONUS` test asserts the
    `BONUS_PICKING` transition.
  - `TOSS_UP_TICK` now takes a `dtMs: number` payload. The existing test
    was updated to pass `dtMs: 1000` at each tick so the semantics are
    preserved (one reveal per second).
  - `GameAction` union was extended with 10 new actions (`BUZZ_IN`,
    `TOSS_UP_SOLVE_ATTEMPT`, `CANCEL_TOSS_UP_ATTEMPT`,
    `BONUS_CHOOSE_LETTERS`, `BONUS_TICK`, `BONUS_SOLVE_ATTEMPT`,
    `RESET_ROUND`, `RANDOM_PUZZLE`, `SELECT_PUZZLE`, and the payload
    upgrade on `TOSS_UP_TICK`). `TurnState` union was extended with 5 new
    values (`TOSSUP_REVEALING`, `TOSSUP_BUZZED`, `TOSSUP_LOCKED_OUT`,
    `BONUS_PICKING`, `BONUS_SOLVE_TIMER`).
  - `SPIN_RESULT` behavior is unchanged except for the additive `mustSpin`
    side-effect (true for BANKRUPT/LOSE_TURN, false for VALUE).
  - `GUESS_LETTER` behavior is unchanged except for the additive `mustSpin`
    side-effect (false on correct guess, true on wrong guess). `spinResult`
    is still preserved on wrong guess to match existing web behavior
    (characterization baseline).
  - `BUY_VOWEL` now rejects (returns same state) when `mustSpin === true`.
    No existing characterization test exercised this path, so no existing
    assertion changes.
