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
